import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export type JWTClaims = {
  sub: string;
  username: string;
  type: 'access' | 'refresh';
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccess(userId: string, userName: string) {
    const payload: JWTClaims = {
      sub: userId,
      type: 'access',
      username: userName,
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION', "15m"),
    });
  }
}
