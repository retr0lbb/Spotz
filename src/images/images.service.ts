import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { S3Service } from '../s3/s3.service';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module';
import {
  ImageMetadataDTO,
  imageMetadataSchema,
} from './dto/image-metadata.dto';
import { imagesMetadata, spotsImages, spotsTable } from '../drizzle/schemas';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const BUCKET = 'spots';

@Injectable()
export class ImagesService {
  constructor(
    private readonly s3service: S3Service,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  async generateUploadUrl(spotId: string, metadata: ImageMetadataDTO) {
    const spot = await this.db
      .select()
      .from(spotsTable)
      .where(eq(spotsTable.id, spotId));

    if (!spot || spot.length > 1 || spot.length <= 0) {
      throw new NotFoundException('Spot Not found for upload');
    }

    const ext = metadata.originalName.split('.').pop();

    const imageId = randomUUID();

    const s3Key = `spots/${spotId}/${imageId}.${ext}`;

    await this.db.insert(imagesMetadata).values({
      id: imageId,
      s3Key,
      mimeType: metadata.mimeType,
      sizeBytes: metadata.sizeBytes,
      status: 'pending',
    });

    await this.db.insert(spotsImages).values({
      imageId,
      spotId,
    }); //mete um promise.all aqui mermao

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
      .select()
      .from(spotsImages)
      .innerJoin(imagesMetadata, eq(spotsImages.imageId, imagesMetadata.id))
      .where(eq(spotsImages.spotId, spotId));

    return Promise.all(
      images.map(async ({ images_metadata }) => ({
        id: images_metadata.id,
        url: await this.s3service.getPresignedUrl(
          BUCKET,
          images_metadata.s3Key,
        ),
        mimeType: images_metadata.mimeType,
        createdAt: images_metadata.createdAt,
      })),
    );
  }
}
