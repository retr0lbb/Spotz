import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { S3Service } from '../../s3/s3.service';
import z from 'zod';
import { DRIZZLE, type DrizzleDB } from '../../drizzle/drizzle.module';
import { imagesMetadata } from '../../drizzle/schemas';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

const imageMetadataSchema = z.object({
  mimetype: z.string(),
  folder: z.string(),
  sizeBytes: z.number(),
  originalName: z.string(),
  uniqueId: z.uuid(),
});


// O image service deve ser o unico gerenciando o ImageMetadata?
// ver o por que que ta demorando eras para excluir o image metadata no tx
@Injectable()
export class ImageService {
  constructor(
    private readonly s3Service: S3Service,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly configService: ConfigService,
  ) {}

  async generateUploadUrl(data: z.infer<typeof imageMetadataSchema>) {
    const ext = data.originalName.split('.').pop();
    const imageId = randomUUID();

    const s3Key = `${data.folder}/${data.uniqueId}/${imageId}.${ext}`;

    await this.db.insert(imagesMetadata).values({
      id: imageId,
      s3Key: s3Key,
      mimeType: data.mimetype,
      sizeBytes: data.sizeBytes,
      status: 'pending',
    });

    const url = await this.s3Service.getPresignedUploadUrl(
      s3Key,
      data.mimetype,
    );

    return { url, imageId };
  }

  async confirmImageUpload(imageId: string) {
    const [image] = await this.db
      .select()
      .from(imagesMetadata)
      .where(eq(imagesMetadata.id, imageId));

    if (!image) throw new NotFoundException('Image not found');

    if (image.status == 'active') {
      return;
    }

    await this.db
      .update(imagesMetadata)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(imagesMetadata.id, imageId));
  }

  async getImageUrl(key: string | null) {
    if(!key){
      return null
    }
    return await this.s3Service.getPresignedUrl(key, 300);
  }

  async deleteImage(imageId: string) {
    const [image] = await this.db
      .select()
      .from(imagesMetadata)
      .where(eq(imagesMetadata.id, imageId));
    

    if (!image) {
      return;
    }

    await this.db.transaction(async (tx) => {
      await this.s3Service.deleteObject(image.s3Key);
      // await tx.delete(imagesMetadata).where(eq(imagesMetadata.id, image.id));
    });


    await this.db.delete(imagesMetadata).where(eq(imagesMetadata.id, imageId))

  }
}
