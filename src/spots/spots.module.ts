import { Module } from '@nestjs/common';
import { SpotsService } from './spots.service';
import { SpotsController } from './spots.controller';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [SpotsService],
  controllers: [SpotsController],
})
export class SpotsModule {}
