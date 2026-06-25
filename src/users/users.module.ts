import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [DrizzleModule],
})
export class UsersModule {}
