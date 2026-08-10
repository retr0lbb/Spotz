import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Service } from './s3.service';
import { S3_CLIENT } from './s3.constants';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: S3_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new S3Client({
          endpoint: config.getOrThrow<string>('S3_ENDPOINT'),
          region: config.get<string>('S3_REGION') ?? 'us-east-1',
          credentials: {
            accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY'),
            secretAccessKey: config.getOrThrow<string>('S3_SECRET_KEY'),
          },
          forcePathStyle: true,
        }),
    },
    S3Service,
  ],
  exports: [S3Service],
})
export class S3Module {}
