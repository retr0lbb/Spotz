import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ConfigModule } from '@nestjs/config';
import { SpotsModule } from './spots/spots.module';

@Module({
  imports: [DrizzleModule, ConfigModule.forRoot(), SpotsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
