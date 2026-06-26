// auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JWTClaims } from '../../common/services/token-service';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JWTClaims => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);