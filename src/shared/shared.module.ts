import { Global, Module } from '@nestjs/common';
import { TokenService } from './services/token-service';
import { EncryptService } from './services/encrypt-service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TokenService, EncryptService],
  exports: [TokenService, EncryptService],
})
export class CommonModule {}
