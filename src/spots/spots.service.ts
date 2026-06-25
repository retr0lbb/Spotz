import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module';
import { CreateSpotDTO } from './dto/create-spot.dto';
import { spotsTable } from '../drizzle/schemas';
import { GetAllSpotsQuery } from './dto/getAllSpots.dto';
import { sql } from 'drizzle-orm';

@Injectable()
export class SpotsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async createSpot(payload: CreateSpotDTO) {
    try {
        const spot = await this.db
          .insert(spotsTable)
          .values({
            location:`POINT(${payload.lon} ${payload.lat})`,
            address: payload.address,
            description: payload.description,
            alias: payload.alias,
          }).returning()

          return spot
    } catch (error) {
      console.log(error)
    }
  }


  async getAllSpots(params: GetAllSpotsQuery){
    try {
      const spots = await this.db.execute(sql`
      SELECT *, ST_AsText(location) as location_text 
        FROM spots
        WHERE ST_DWithin(location, ST_MakePoint(${params.lon ?? 0}, ${params.lat})::geography, ${params.radius})
        `)

      return spots.rows
      
    } catch (error) {
      console.log(error)
    }
  }
}

