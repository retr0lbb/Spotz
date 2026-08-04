import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { S3Service } from '../s3/s3.service';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module';
import { ImageMetadataDTO } from './dto/image-metadata.dto';
import { imagesMetadata, spotsImages, spotsTable, usersTable } from '../drizzle/schemas';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { isWithinDistance } from '../drizzle/schemas/spots-images.schema';

const BUCKET = 'spots';

@Injectable()
export class ImagesService {
  constructor(
    private readonly s3service: S3Service,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  async generateUploadUrl(spotId: string, userId: string, metadata: ImageMetadataDTO) {
    const [user] = await this.db.select().from(usersTable).where(eq(usersTable.id, userId))

    if(!user){
      throw new NotFoundException("User not found")
    }

    const [spot] = await this.db
      .select()
      .from(spotsTable)
      .where(eq(spotsTable.id, spotId));

    if (!spot) {
      throw new NotFoundException('Spot Not found for upload');
    }

    const ext = metadata.originalName.split('.').pop();

    const imageId = randomUUID();

    const s3Key = `spots/${spotId}/${imageId}.${ext}`;

    const isOwner = spot.userId === userId;

    if(!isOwner){
      if(!metadata.latitude || !metadata.longitude){
        throw new BadRequestException("User location is necessary for this spot. as it is not the spot owner")
      }
      
      const withinRange = await isWithinDistance(spotId, metadata.latitude, metadata.longitude, 100, this.db)

      if(!withinRange ){
        throw new BadRequestException("User must be at least 100 meters from the spot to post a photo")
      }
    }


    await Promise.all([
      this.db.insert(imagesMetadata).values({
        id: imageId,
        s3Key,
        mimeType: metadata.mimeType,
        sizeBytes: metadata.sizeBytes,
        status: 'pending',
      }),

      this.db.insert(spotsImages).values({
        imageId,
        uploadedBy: userId,
        spotId,
      })
    ])

    const uploadUrl = await this.s3service.getPresignedUploadUrl(
      BUCKET,
      s3Key,
      metadata.mimeType,
    );

    return { imageId, uploadUrl };
  }

  async confirmUpload(imageId: string) {
    const [image] = await this.db
      .select()
      .from(imagesMetadata)
      .where(eq(imagesMetadata.id, imageId));

    if (!image) throw new NotFoundException('Image not found');

    await this.db
      .update(imagesMetadata)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(imagesMetadata.id, imageId));
  }

  async getSpotImages(spotId: string) {
    const [spot] = await this.db
      .select()
      .from(spotsTable)
      .where(eq(spotsTable.id, spotId));

    if (!spot) {
      throw new NotFoundException('Spot not found');
    }

    const images = await this.db
      .select({
        imageId: spotsImages.id,
        uploadedBy: spotsImages.uploadedBy,
        key: imagesMetadata.s3Key,
        status: imagesMetadata.status,
        mimeType: imagesMetadata.mimeType,
        uploadedAt: imagesMetadata.createdAt
      })
      .from(spotsImages)
      .innerJoin(imagesMetadata, eq(spotsImages.imageId, imagesMetadata.id))
      .where(eq(spotsImages.spotId, spotId));

    return Promise.all(
      images.map(async ({ imageId, key, uploadedBy, mimeType, status, uploadedAt }) => ({
        id: imageId,
        url: await this.s3service.getPresignedUrl(
          BUCKET,
          key
        ),
        mimeType: mimeType,
        uploadedAt: uploadedAt,
        uploadedBy: uploadedBy,
        status: status
      })),
    );
  }
}
