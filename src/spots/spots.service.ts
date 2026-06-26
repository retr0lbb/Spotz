import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module';
import { CreateSpotDTO } from './dto/create-spot.dto';
import { UpdateSpotDTO } from './dto/update-spot.dto';
import { spotsTable, usersTable } from '../drizzle/schemas';
import { GetAllSpotsQuery } from './dto/getAllSpots.dto';
import { sql, eq } from 'drizzle-orm';
import { S3Service } from '../s3/s3.service';

const BUCKET = 'spots';

@Injectable()
export class SpotsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly s3service: S3Service,
  ) {}

  async createSpot(userId: string, payload: CreateSpotDTO) {
    const user = await this.db.select().from(usersTable).where(eq(usersTable.id, userId))
    
    if(!user){
      throw new NotFoundException("user not found")
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

  async updateSpot(id: string, payload: UpdateSpotDTO) {
    const values: Record<string, unknown> = {};
    if (payload.alias !== undefined) values.alias = payload.alias;
    if (payload.description !== undefined)
      values.description = payload.description;
    if (payload.address !== undefined) values.address = payload.address;
    if (payload.lat !== undefined && payload.lon !== undefined) {
      values.location = `POINT(${payload.lon} ${payload.lat})`;
    }

    const [spot] = await this.db
      .update(spotsTable)
      .set(values)
      .where(eq(spotsTable.id, id))
      .returning();

    return spot;
  }

  async deleteSpot(id: string) {
    const [spot] = await this.db
      .select()
      .from(spotsTable)
      .where(eq(spotsTable.id, id));

    if (!spot) {
      return;
    }

    await this.db.transaction(async (tx) => {
      await this.s3service.deleteFolder(BUCKET, `spots/${spot.id}/`);

      await tx.delete(spotsTable).where(eq(spotsTable.id, spot.id));
    });
  }
}
