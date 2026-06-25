import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { registerSchema, type RegisterDTO } from './dto/register.dto';
import { loginSchema, type LoginDTO } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDTO) {
    const data = registerSchema.parse(body);
    return this.authService.register(data);
  }

  @Post('login')
  async login(@Body() body: LoginDTO) {
    const data = loginSchema.parse(body);
    return this.authService.login(data);
  }
}
