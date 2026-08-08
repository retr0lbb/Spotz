import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ConfigModule } from '@nestjs/config';
import { SpotsModule } from './spots/spots.module';
import { S3Module } from './s3/s3.module';
import { ImagesModule } from './images/images.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './shared/shared.module';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot(),
    SpotsModule,
    S3Module,
    ImagesModule,
    UsersModule,
    AuthModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
