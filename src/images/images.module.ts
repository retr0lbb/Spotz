import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { S3Module } from '../s3/s3.module';

@Module({
  providers: [ImagesService],
  imports: [S3Module, DrizzleModule],
  exports: [ImagesService]
})
export class ImagesModule {}
