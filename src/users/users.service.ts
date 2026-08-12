import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module';
import { imagesMetadata, usersTable } from '../drizzle/schemas';
import { eq } from 'drizzle-orm';
import { S3Service } from '../s3/s3.service';
import { ImageMetadataDTO } from './dto/image.dto';
import { ImageService } from '../shared/services/image.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly s3Service: S3Service,
    private readonly imageService: ImageService,
  ) {}


  async getUserData(userId: string) {
    const [user] = await this.db
      .select({
        username: usersTable.username,
        id: usersTable.id,
        s3Key: imagesMetadata.s3Key,
        email: usersTable.email,
        pictureId: usersTable.pictureId,
        metadata: imagesMetadata
      })
      .from(usersTable)
      .leftJoin(imagesMetadata, eq(imagesMetadata.id, usersTable.pictureId))
      .where(eq(usersTable.id, userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    console.log(user.metadata)

    if (!user.s3Key) {
      return {
        username: user.username,
        id: user.id,
        email: user.email,
        pictureUrl: null,
      };
    }

    const url = await this.s3Service.getPresignedUrl(user.s3Key!);

    return {
      username: user.username,
      id: user.id,
      email: user.email,
      pictureUrl: url,
    };
  }

  async getUploadUrl(userId: string, metadata: ImageMetadataDTO) {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if(user.pictureId !== null){
      throw new BadRequestException("User already have an image attached to him")
    }

    const data = await this.imageService.generateUploadUrl({
      folder: 'profile',
      mimetype: metadata.mimeType,
      originalName: metadata.originalName,
      sizeBytes: metadata.sizeBytes,
      uniqueId: userId,
    });

    await this.db.update(usersTable).set({ pictureId: data.imageId });

    return data;
  }
  
  async deleteUserAccount(userId: string){
    const [user] = await this.db.select().from(usersTable).where(eq(usersTable.id, userId))

    if(!user){
      return
    }
    console.log("HERE 1")

    if(user.pictureId !== null){
      console.log("HERE 2")

      const [image] = await this.db.select().from(imagesMetadata).where(eq(imagesMetadata.id, user.pictureId))

      await this.db.transaction(async (tx) => {
        await tx.delete(usersTable).where(eq(usersTable.id, userId))
        console.log("HERE 2.5")
        await this.imageService.deleteImage(image.id)
        console.log("HERE 2.7")
      })
      console.log("HERE 3")


      return
    }
    console.log("HERE 4")


    await this.db.delete(usersTable).where(eq(usersTable.id, userId))
    console.log("HERE 5")
  }

  async getAllAccounts(){
    const data = await this.db.select().from(usersTable)

    return data
  }

  async getAllMetadata(){
    const data = await this.db.select().from(imagesMetadata)

    return data
  }

  async deleteAll(){
    await this.db.delete(imagesMetadata)
  }
}
