import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { createSpotSchema, type CreateSpotDTO } from './dto/create-spot.dto';
import { SpotsService } from './spots.service';
import { getAllSpotsQuerySchema, type GetAllSpotsQuery } from './dto/getAllSpots.dto';
import type { UpdateSpotDTO, UpdateSpotParamsDTO } from './dto/update-spot.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { JWTClaims } from '../shared/services/token-service';
import { ZodValidationPipe } from '../shared/pipes/zod.pipe';
import {
  type UploadSpotImageDTO,
  uploadSpotImageDTOSchema,
} from './dto/upload-image.dto';

@Controller('spots')
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

  @UseGuards(JwtGuard)
  @Post()
  async createSpot(
    @CurrentUser() user: JWTClaims,
    @Body() body: CreateSpotDTO,
  ) {
    if (!user) {
      throw new Error('Yeah user doesnot passed');
    }
    const data = createSpotSchema.parse(body);

    await this.spotsService.createSpot(user.sub, data);
  }

  @Get()
  async getSpotsNearMe(@Query(new ZodValidationPipe(getAllSpotsQuerySchema)) query: GetAllSpotsQuery) {
    const result = await this.spotsService.getAllSpots(query);

    return result;
  }

  @UseGuards(JwtGuard)
  @Put('/:id')
  async updateSpot(
    @CurrentUser() user: JWTClaims,
    @Param() params: UpdateSpotParamsDTO,
    @Body() body: UpdateSpotDTO,
  ) {
    const result = await this.spotsService.updateSpot(
      params.id,
      user.sub,
      body,
    );

    return result;
  }

  @UseGuards(JwtGuard)
  @Delete('/:id')
  async deleteSpot(
    @CurrentUser() user: JWTClaims,
    @Param() param: { id: string },
  ) {
    await this.spotsService.deleteSpot(user.sub, param.id);

    return 'ok';
  }

  @UseGuards(JwtGuard)
  @Post('/:id/image')
  async getUploadUrl(
    @Param() param: { id: string },
    @CurrentUser() user: JWTClaims,
    @Body(new ZodValidationPipe(uploadSpotImageDTOSchema))
    body: UploadSpotImageDTO,
  ) {
    const data = await this.spotsService.uploadSpotImage(
      param.id,
      user.sub,
      body,
    );

    return { uploadUrl: data.url, imageId: data.imageId };
  }

  @Post('/:id/image/:imageId/confirm')
  async confirmUpload(@Param('imageId') imageId: string) {
    return await this.spotsService.confirmUpload(imageId);
  }

}
