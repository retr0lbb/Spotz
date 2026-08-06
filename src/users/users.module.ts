import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { AuthModule } from '../auth/auth.module';
import { ImagesModule } from '../images/images.module';
import { S3Module } from '../s3/s3.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [DrizzleModule, AuthModule, ImagesModule, S3Module],
})
export class UsersModule {}
