import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { S3Service } from "../../s3/s3.service";
import z, { string } from "zod";
import { DRIZZLE, type DrizzleDB } from "../../drizzle/drizzle.module";
import { imagesMetadata } from "../../drizzle/schemas";
import { eq } from "drizzle-orm";

const imageMetadataSchema = z.object({
    mimetype: z.string(),
    bucket: z.string(),
    s3key: z.string(),
    sizeBytes: z.number(),
    imageId: z.uuid()
})

@Injectable()
export class ImageService{
    constructor(
        private readonly s3Service: S3Service,
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
    ){}

    async generateUploadUrl(data: z.infer<typeof imageMetadataSchema>){

        await this.db.insert(imagesMetadata).values({
            id: data.imageId,
            s3Key: data.s3key,
            mimeType: data.mimetype,
            status: "pending"
        })

        return await this.s3Service.getPresignedUploadUrl(data.bucket, data.s3key, data.mimetype)
    }

    async confirmImageUpload(imageId: string){
        const [image] = await this.db
            .select()
            .from(imagesMetadata)
            .where(eq(imagesMetadata.id, imageId))

        
        if (!image) throw new NotFoundException('Image not found');

        if(image.status == "active"){
            return
        }

        await this.db
            .update(imagesMetadata)
            .set({ status: 'active', updatedAt: new Date() })
            .where(eq(imagesMetadata.id, imageId))
    }

    async getImageUrl(bucket: string, key: string){
        return await this.s3Service.getPresignedUrl(bucket, key, 300)
    }

    async deleteImage(bucket: string, imageId: string){
        const [image] = await this.db.select().from(imagesMetadata).where(eq(imagesMetadata.id, imageId))
        
        if(!image){
            return
        }

        await this.db.transaction(async (tx) => {
            await this.s3Service.deleteObject(bucket, image.s3Key)
            await tx.delete(imagesMetadata).where(eq(imagesMetadata.id, image.id))
        })
    }
}