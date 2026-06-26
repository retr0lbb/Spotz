import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { type Request } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('users')
export class UsersController {
  @UseGuards(JwtGuard)
  @Get('me')
  async getUserJWTdata(@Req() request: Request) {
    return request.user;
  }
}
