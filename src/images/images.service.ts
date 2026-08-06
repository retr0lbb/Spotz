import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { S3Service } from '../s3/s3.service';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module';
import { ImageMetadataDTO } from './dto/image-metadata.dto';
import {
  imagesMetadata,
  spotsImages,
  spotsTable,
  usersTable,
} from '../drizzle/schemas';
import { and, desc, eq, lt, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  decodeCursor,
  encodeCursor,
  isWithinDistance,
} from '../drizzle/schemas/spots-images.schema';
import { GetSpotImagesQueryDTO } from './dto/get-spot-images.dto';

const BUCKET = 'spots';

@Injectable()
export class ImagesService {
  constructor(
    private readonly s3service: S3Service,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  async generateUploadUrl(
    spotId: string,
    userId: string,
    metadata: ImageMetadataDTO,
  ) {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      throw new NotFoundException('User not found');
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

    if (!isOwner) {
      if (!metadata.latitude || !metadata.longitude) {
        throw new BadRequestException(
          'User location is necessary for this spot. as it is not the spot owner',
        );
      }

      const withinRange = await isWithinDistance(
        spotId,
        metadata.latitude,
        metadata.longitude,
        100,
        this.db,
      );

      if (!withinRange) {
        throw new BadRequestException(
          'User must be at least 100 meters from the spot to post a photo',
        );
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
      }),
    ]);

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

  async deleteSpotImage(spotId: string, imageId: string, userId: string) {
    const [spot] = await this.db
      .select()
      .from(spotsTable)
      .where(eq(spotsTable.id, spotId));

    if (!spot) {
      throw new NotFoundException('Spot not found');
    }

    const [image] = await this.db
      .select({
        uploadedBy: spotsImages.uploadedBy,
        id: spotsImages.id,
        s3key: imagesMetadata.s3Key,
        metadataId: imagesMetadata.id,
      })
      .from(spotsImages)
      .leftJoin(imagesMetadata, eq(spotsImages.imageId, imagesMetadata.id))
      .where(eq(spotsImages.id, imageId));

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    if (image.uploadedBy !== userId) {
      throw new ForbiddenException('User is not the owner of the image.');
    }

    if (!image.s3key || !image.metadataId) {
      await this.db.delete(spotsImages).where(eq(spotsImages.id, imageId));
      return;
    }

    await this.db.transaction(async (tx) => {
      await this.s3service.deleteObject(BUCKET, image.s3key!);
      await tx.delete(spotsImages).where(eq(spotsImages.id, imageId));
      await tx
        .delete(imagesMetadata)
        .where(eq(imagesMetadata.id, image.metadataId!));
    });
  }

  async getSpotImages(spotId: string, query: GetSpotImagesQueryDTO) {
    const [spot] = await this.db
      .select()
      .from(spotsTable)
      .where(eq(spotsTable.id, spotId));

    if (!spot) {
      throw new NotFoundException('Spot not found');
    }

    const decodedCursor = query.cursor ? decodeCursor(query.cursor) : undefined;

    const images = await this.db
      .select({
        imageId: spotsImages.id,
        uploadedBy: spotsImages.uploadedBy,
        key: imagesMetadata.s3Key,
        status: imagesMetadata.status,
        mimeType: imagesMetadata.mimeType,
        uploadedAt: imagesMetadata.createdAt,
      })
      .from(spotsImages)
      .innerJoin(imagesMetadata, eq(spotsImages.imageId, imagesMetadata.id))
      .where(
        and(
          eq(spotsImages.spotId, spotId),
          decodedCursor
            ? or(
                lt(spotsImages.createdAt, decodedCursor.createdAt),
                and(
                  eq(spotsImages.createdAt, decodedCursor.createdAt),
                  lt(spotsImages.id, decodedCursor.id),
                ),
              )
            : undefined,
          query.ownerId ? eq(spotsImages.uploadedBy, query.ownerId): undefined
        ),
      )
      .orderBy(desc(spotsImages.createdAt), desc(spotsImages.id))
      .limit(query.limit + 1);

    const hasNextPage = images.length > query.limit;
    const items = hasNextPage ? images.slice(0, query.limit) : images;
    const lastImage = items[items.length - 1];
    const nextCursor = hasNextPage
      ? encodeCursor({ createdAt: lastImage.uploadedAt, id: lastImage.imageId })
      : null;

    const resultImages = await Promise.all(
      images.map(
        async ({ imageId, key, uploadedBy, mimeType, status, uploadedAt }) => ({
          id: imageId,
          url: await this.s3service.getPresignedUrl(BUCKET, key),
          mimeType: mimeType,
          uploadedAt: uploadedAt,
          uploadedBy: uploadedBy,
          status: status,
        }),
      ),
    );

    return { images: resultImages, nextCursor };
  }
}
