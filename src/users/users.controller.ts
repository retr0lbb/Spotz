import { Body, Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { type Request } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { JWTClaims } from '../common/services/token-service';
import { UsersService } from './users.service';
import { ImagesService } from '../images/images.service';
import type { ImageMetadataDTO } from '../images/dto/image-metadata.dto';

@Controller('users')
export class UsersController {

  constructor(
    private readonly userService: UsersService, 
    private readonly imageService: ImagesService
  ){

  }
  @UseGuards(JwtGuard)
  @Get()
  async getUserJWTdata(@CurrentUser() user: JWTClaims) {
    return this.userService.getUserData(user.sub)
  }

  @Delete()
  @UseGuards(JwtGuard)
  async deleteUserProfile(@CurrentUser() user: JWTClaims){
    await this.userService.deleteUserProfile(user.sub)
  }

  @UseGuards(JwtGuard)
  @Post("/picture")
  async addUserPicture(@CurrentUser() user: JWTClaims, @Body() body: ImageMetadataDTO){
    return await this.imageService.createProfilePictureMetadata(user.sub, body)
  }

}
