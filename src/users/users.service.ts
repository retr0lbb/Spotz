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

  async deleteUserProfile(userId: string): Promise<void> {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) return;

    await this.db.delete(usersTable).where(eq(usersTable.id, user.id));
  }

  async getUserData(userId: string) {
    const [user] = await this.db
      .select({
        username: usersTable.username,
        id: usersTable.id,
        s3Key: imagesMetadata.s3Key,
        email: usersTable.email,
        pictureId: usersTable.pictureId,
      })
      .from(usersTable)
      .leftJoin(imagesMetadata, eq(imagesMetadata.id, usersTable.pictureId))
      .where(eq(usersTable.id, userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

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

    console.log(metadata);

    if (!user) {
      throw new NotFoundException('User not found');
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
}
