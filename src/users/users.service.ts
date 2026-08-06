import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module';
import { imagesMetadata, usersTable } from '../drizzle/schemas';
import { eq } from 'drizzle-orm';
import { S3Service } from '../s3/s3.service';
import { imageMetadataSchema } from '../images/dto/image-metadata.dto';

@Injectable()
export class UsersService {
  constructor(
      @Inject(DRIZZLE) private readonly db: DrizzleDB,
      private readonly s3Service: S3Service
  ) {}


  async deleteUserProfile(userId: string): Promise<void>{

    const [user] = await this.db.select().from(usersTable).where(eq(usersTable.id, userId))

    if(!user) return

    await this.db.delete(usersTable).where(eq(usersTable.id, user.id))
  }

  async getUserData(userId: string){
    const [user] = await this.db
    .select({username: usersTable.username, id: usersTable.id, s3Key: imagesMetadata.s3Key, email: usersTable.email, pictureId: usersTable.pictureId}).from(usersTable)
    .leftJoin(imagesMetadata, eq(imagesMetadata.id, usersTable.pictureId))
    .where(eq(usersTable.id, userId))

    const [logIMage] = await this.db.select().from(imagesMetadata)

    if(!user){
      throw new NotFoundException("User not found")
    }

    console.log(user)
    console.log(logIMage)
    if(!user.s3Key){
      return {username: user.username, id: user.id, email: user.email, pictureUrl: null}
    }

    const url = await this.s3Service.getPresignedUrl("profile", user.s3Key!)

    return {username: user.username, id: user.id, email: user.email, pictureUrl: url}
  }

}
