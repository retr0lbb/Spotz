import { Body, Controller, HttpCode, Post, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { registerSchema, type RegisterDTO } from './dto/register.dto';
import { loginSchema, type LoginDTO } from './dto/login.dto';
import { ZodValidationPipe } from '../shared/pipes/zod.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(201)
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterDTO,
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body(new ZodValidationPipe(loginSchema)) body: LoginDTO) {
    return this.authService.login(body);
  }
}
