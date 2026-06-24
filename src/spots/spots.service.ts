import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module';
import { CreateSpotDTO } from './dto/create-spot.dto';
import { spotsTable } from '../drizzle/schemas';
import { spotsImages } from '../drizzle/schemas/spots-images.schema';
import { UploadImageDto } from './dto/upload-image.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class SpotsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async createSpot(payload: CreateSpotDTO) {
    try {
        const spot = await this.db
          .insert(spotsTable)
          .values({
            lat: String(payload.lat),
            lon: String(payload.lon),
            address: payload.address,
            description: payload.description,
            alias: payload.alias,
          })
    } catch (error) {
      console.log(error)
    }
  }


}
