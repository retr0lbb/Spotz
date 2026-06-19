import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../drizzle/drizzle.module';
import { CreateSpotDTO } from './dto/create-spot.dto';
import { spotsTable } from '../drizzle/schemas';
import { spotsImages } from '../drizzle/schemas/spots-images.schema';

@Injectable()
export class SpotsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async createSpot(payload: CreateSpotDTO) {
    try {
      await this.db.transaction(async (tx) => {
        const spot = await tx
          .insert(spotsTable)
          .values({
            lat: String(payload.lat),
            lon: String(payload.lon),
            address: payload.address,
            description: payload.description,
            alias: payload.alias,
          })
          .returning();

        if (spot.length <= 0) {
          tx.rollback();
          throw new Error('Something went wrong wile saving spot');
        }

        const spotId = spot[0].id;

        const formattedArr = payload.photos?.map((photo) => {
          return {
            key: photo.key,
            spotId: spotId,
            mimeType: photo.mime_type,
            bytes: photo.bytes,
          };
        });

        if (!formattedArr) {
          throw new Error('No photos');
        }
        await tx.insert(spotsImages).values(formattedArr);
      });
    } catch (error) {
      console.log(error)
    }
  }
}
