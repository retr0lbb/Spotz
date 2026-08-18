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
import { sql, eq, param } from 'drizzle-orm';
import { S3Service } from '../s3/s3.service';
import {
  decodeCursor,
  decodeSpotsCursor,
  encodeSpotsCursor,
  isWithinDistance,
  spotsImages,
} from '../drizzle/schemas/spots-images.schema';
import { ImageService } from '../shared/services/image.service';
import type { ImageMetadataDTO } from './dto/image-spot.dto';
import { QueryResult } from 'pg';
import ur from 'zod/v4/locales/ur.js';

@Injectable()
export class SpotsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly s3service: S3Service,
    private readonly imageService: ImageService,
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

    type QueryResponse = {
      spot_id: string
      user_id: string
      alias: string
      description: string
      address: string
      spot_created_at: string
      location_text: string
      distance_meters: string
      spot_image_id: string
      image_id: string
      s3_key: string 
      image_created_at: string
      size_bytes: number,
      mime_type: string
    }

    const decodedCursor = params.cursor ? decodeSpotsCursor(params.cursor) : undefined
  const spots: QueryResult<QueryResponse> = await this.db.execute(
      sql`
        WITH nearby AS (
          SELECT 
            s.id,
            s.user_id,
            s.alias,
            s.description,
            s.address,
            s.created_at,
            ST_AsText(location) as location_text,
            ROUND(ST_Distance(location, ST_MakePoint(${params.lon}, ${params.lat})::geography)::numeric, 0) as distance_meters
          FROM spots s
          WHERE ST_DWithin(location, ST_MakePoint(${params.lon}, ${params.lat})::geography, ${params.radius})
        )
        SELECT
          n.id AS spot_id,
          n.user_id,
          n.alias,
          n.description,
          n.address,
          n.created_at AS spot_created_at,
          n.location_text,
          n.distance_meters,
          img.spot_image_id,
          img.image_id,
          img.s3_key,
          img.image_created_at,
          img.size_bytes,
          img.mime_type
        FROM nearby n
        LEFT JOIN LATERAL (
          SELECT
            si.id AS spot_image_id,
            si.image_id,
            mt.s3_key,
            mt.created_at AS image_created_at,
            mt.size_bytes,
            mt.mime_type
          FROM spots_images si
          JOIN images_metadata mt ON si.image_id = mt.id
          WHERE si.spot_id = n.id
          ORDER BY si.created_at ASC
          LIMIT 1
        ) img ON true
        WHERE ${

          decodedCursor ? sql`(
            n.distance_meters > ${decodedCursor.distance}
            OR (n.distance_meters = ${decodedCursor.distance} AND n.id::text > ${decodedCursor.id})
          )` :sql`true`
        }
        ORDER BY n.distance_meters ASC
        LIMIT ${params.limit + 1}
      `,
    );

    const hasNextPage = spots.rows.length > params.limit;
    const items = hasNextPage ? spots.rows.slice(0, params.limit) : spots.rows;
    const lastSpot = items[items.length - 1];

    const nextCursor = hasNextPage
      ? encodeSpotsCursor({ distance: lastSpot.distance_meters as unknown as number, id: lastSpot.spot_id as unknown as string })
      : null;

    const spotsWithUrl = await Promise.all(
      items.map(async ({ s3_key, ...rest }) => {
        const url = await this.imageService.getImageUrl(s3_key);

        if (!url) {
          throw new BadRequestException('Cant generate url');
        }

        return {
          ...rest,
          image_url: url,
        };
      }),
    );

    return { spots: spotsWithUrl, nextCursor, perPage: params.limit, items: items.length };
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

    if (spot.userId !== userId && spot.userId !== null) {
      throw new ForbiddenException('Cannot delete a project that is not yours');
    }

    if (!spot) {
      return;
    }

    await this.db.transaction(async (tx) => {
      await this.s3service.deleteFolder(`spots/${spot.id}/`);

      await tx.delete(spotsTable).where(eq(spotsTable.id, spot.id));
    });
  }

  async uploadSpotImage(
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

    const { url, imageId } = await this.imageService.generateUploadUrl({
      folder: 'spots',
      mimetype: metadata.mimeType,
      originalName: metadata.originalName,
      uniqueId: spot.id,
      sizeBytes: metadata.sizeBytes,
    });

    await this.db.insert(spotsImages).values({
      imageId,
      uploadedBy: userId,
      spotId,
    });

    return { url, imageId };
  }

  async confirmUpload(imageId: string) {
    await this.imageService.confirmImageUpload(imageId);
  }
}
