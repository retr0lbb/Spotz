import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module';
import { CreateSpotDTO } from './dto/create-spot.dto';
import { spotsTable } from '../drizzle/schemas';

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

}
