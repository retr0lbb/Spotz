import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module';
import { CreateSpotDTO } from './dto/create-spot.dto';
import { UpdateSpotDTO } from './dto/update-spot.dto';
import { spotsTable, usersTable } from '../drizzle/schemas';
import { GetAllSpotsQuery } from './dto/getAllSpots.dto';
import { sql, eq } from 'drizzle-orm';
import { S3Service } from '../s3/s3.service';
import { ImageMetadataDTO } from '../images/dto/image-metadata.dto';
import { randomUUID } from 'crypto';
import { isWithinDistance, spotsImages } from '../drizzle/schemas/spots-images.schema';
import { ImageService } from '../shared/services/image.service';

const BUCKET = 'spots';

@Injectable()
export class SpotsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly s3service: S3Service,
    private readonly imageService: ImageService
  ) {}

  async createSpot(userId: string, payload: CreateSpotDTO) {
    const user = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      throw new NotFoundException('user not found');
    }

    const spot = await this.db
      .insert(spotsTable)
      .values({
        userId: userId,
        location: `POINT(${payload.lon} ${payload.lat})`,
        address: payload.address,
        description: payload.description,
        alias: payload.alias,
      })
      .returning();

    return spot;
  }

  async getAllSpots(params: GetAllSpotsQuery) {
    const spots = await this.db.execute(
      sql`
        SELECT 
          *, 
          ST_AsText(location) as location_text,
          ROUND(ST_Distance(location, ST_MakePoint(${params.lon}, ${params.lat})::geography)::numeric, 0) as distance_meters 
        FROM spots
        WHERE ST_DWithin(location, ST_MakePoint(${params.lon ?? 0}, ${params.lat})::geography, ${params.radius})
      `,
    );

    return spots.rows;
  }

  async updateSpot(id: string, userId: string, payload: UpdateSpotDTO) {
    const values: Record<string, unknown> = {};
    if (payload.alias !== undefined) values.alias = payload.alias;
    if (payload.description !== undefined)
      values.description = payload.description;
    if (payload.address !== undefined) values.address = payload.address;
    if (payload.lat !== undefined && payload.lon !== undefined) {
      values.location = `POINT(${payload.lon} ${payload.lat})`;
    }

    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    const [spot] = await this.db
      .select()
      .from(spotsTable)
      .where(eq(spotsTable.id, id));

    if (!spot) {
      throw new NotFoundException('Spot not found');
    }
    if (!user || spot.userId !== user.id) {
      throw new NotFoundException('User acc with the spot not found');
    }

    const [updatedSpot] = await this.db
      .update(spotsTable)
      .set(values)
      .where(eq(spotsTable.id, id))
      .returning();

    return updatedSpot;
  }

  async deleteSpot(userId: string, id: string) {
    const [spot] = await this.db
      .select()
      .from(spotsTable)
      .where(eq(spotsTable.id, id));

    if (spot.userId !== userId) {
      throw new ForbiddenException('Cannot delete a project that is not yours');
    }

    if (!spot) {
      return;
    }

    await this.db.transaction(async (tx) => {
      await this.s3service.deleteFolder(BUCKET, `spots/${spot.id}/`);

      await tx.delete(spotsTable).where(eq(spotsTable.id, spot.id));
    });
  }

  async uploadSpotImage( 
      spotId: string,
      userId: string,
      metadata: ImageMetadataDTO
    ){
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


      const url = await this.imageService.generateUploadUrl({bucket: "spots", mimetype: metadata.mimeType, s3key: s3Key, sizeBytes: metadata.sizeBytes, imageId})

      await this.db.insert(spotsImages).values({
        imageId,
        uploadedBy: userId,
        spotId,
      })

      return {url, imageId}
  }

  async confirmUpload(imageId: string){
    await this.imageService.confirmImageUpload(imageId)
  }
}
