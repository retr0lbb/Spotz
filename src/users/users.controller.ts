import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { JWTClaims } from '../shared/services/token-service';
import { UsersService } from './users.service';
import type { ImageMetadataDTO } from './dto/image.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}
  @UseGuards(JwtGuard)
  @Get()
  async getUserJWTdata(@CurrentUser() user: JWTClaims) {
    return this.userService.getUserData(user.sub);
  }

  @Delete()
  @UseGuards(JwtGuard)
  async deleteUserProfile(@CurrentUser() user: JWTClaims) {
    await this.userService.deleteUserAccount(user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('/picture')
  async addUserPicture(
    @CurrentUser() user: JWTClaims,
    @Body() body: ImageMetadataDTO,
  ) {
    return await this.userService.getUploadUrl(user.sub, body);
  }


  @Post("/picture/confirm")
  @UseGuards(JwtGuard)
  async confirmUserProfilePictureUpload(@CurrentUser() user: JWTClaims){
    await this.userService.confirmUserProfilePicture(user.sub)

    return "ok"
  }
}
