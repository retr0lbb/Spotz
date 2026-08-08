import { Global, Module } from '@nestjs/common';
import { TokenService } from './services/token-service';
import { EncryptService } from './services/encrypt-service';
import { ConfigModule } from '@nestjs/config';
import { ImageService } from './services/image.service';
import { S3Module } from '../s3/s3.module';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Global()
@Module({
  imports: [ConfigModule, S3Module, DrizzleModule],
  providers: [TokenService, EncryptService, ImageService],
  exports: [TokenService, EncryptService, ImageService],
})
export class CommonModule {}
