import { Module } from '@nestjs/common';
import { SpotsService } from './spots.service';
import { SpotsController } from './spots.controller';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { S3Module } from '../s3/s3.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, S3Module, AuthModule],
  providers: [SpotsService],
  controllers: [SpotsController],
})
export class SpotsModule {}
