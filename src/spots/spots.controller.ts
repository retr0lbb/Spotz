import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { createSpotSchema, type CreateSpotDTO } from './dto/create-spot.dto';
import { SpotsService } from './spots.service';
import type { GetAllSpotsQuery } from './dto/getAllSpots.dto';
import type { UpdateSpotDTO, UpdateSpotParamsDTO } from './dto/update-spot.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { JWTClaims } from '../common/services/token-service';

@Controller('spots')
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}
  
  @UseGuards(JwtGuard)
  @Post()
  async createSpot(@CurrentUser() user: JWTClaims, @Body() body: CreateSpotDTO) {

    if(!user){
      throw new Error("Yeah user doesnot passed")
    }
    const data = createSpotSchema.parse(body);

    await this.spotsService.createSpot(user.sub, data );
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

  @UseGuards(JwtGuard)
  @Delete('/:id')
  async deleteSpot(@CurrentUser() user: JWTClaims, @Param() param: { id: string }) {
    await this.spotsService.deleteSpot(user.sub, param.id);

    return 'ok';
  }
}
