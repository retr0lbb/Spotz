import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import {
  type ImageMetadataDTO,
  imageMetadataSchema,
} from './dto/image-metadata.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { JWTClaims } from '../shared/services/token-service';
import type { GetSpotImagesQueryDTO } from './dto/get-spot-images.dto';

@Controller('spots/:spotId/images')
export class ImagesController {
  constructor(private readonly imageService: ImagesService) {}

  @UseGuards(JwtGuard)
  @Post('presigned')
  async generatePostUrl(
    @CurrentUser() user: JWTClaims,
    @Param('spotId') spotId: string,
    @Body() body: ImageMetadataDTO,
  ) {
    const parsedBody = imageMetadataSchema.parse(body);

    const result = await this.imageService.generateUploadUrl(
      spotId,
      user.sub,
      parsedBody,
    );

    return result;
  }

  @Post(':imageId/confirm')
  async confirmUpload(@Param('imageId') imageId: string) {
    return await this.imageService.confirmUpload(imageId);
  }

  @Get()
  async getSpotImages(
    @Param('spotId') spotId: string,
    @Query() query: GetSpotImagesQueryDTO,
  ) {
    return await this.imageService.getSpotImages(spotId, query);
  }

  @UseGuards(JwtGuard)
  @Delete(':imageId')
  async deleteSpotImage(
    @Param('spotId') spotId: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: JWTClaims,
  ) {
    await this.imageService.deleteSpotImage(spotId, imageId, user.sub)

    return;
  }
}
