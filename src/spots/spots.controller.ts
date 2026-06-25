import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { createSpotSchema, type CreateSpotDTO } from './dto/create-spot.dto';
import { SpotsService } from './spots.service';
import type { GetAllSpotsQuery } from './dto/getAllSpots.dto';
import type { UpdateSpotDTO, UpdateSpotParamsDTO } from './dto/update-spot.dto';

@Controller('spots')
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

  @Post()
  async createSpot(@Body() body: CreateSpotDTO) {
    const data = createSpotSchema.parse(body);

    await this.spotsService.createSpot(data);
  }

  @Get()
  async getSpot(@Query() query: GetAllSpotsQuery) {
    const result = await this.spotsService.getAllSpots(query);

    return result;
  }

  @Put('/:id')
  async updateSpot(
    @Param() params: UpdateSpotParamsDTO,
    @Body() body: UpdateSpotDTO,
  ) {
    const result = await this.spotsService.updateSpot(params.id, body);

    return result;
  }

  @Delete('/:id')
  async deleteSpot(@Param() param: { id: string }) {
    await this.spotsService.deleteSpot(param.id);

    return 'ok';
  }
}
