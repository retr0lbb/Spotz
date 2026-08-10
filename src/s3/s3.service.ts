// s3/s3.service.ts
import { Inject, Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_CLIENT } from './s3.constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  constructor(
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly config: ConfigService,
  ) {}

  async upload(key: string, body: Buffer, mimeType: string) {
    const bucket = this.config.getOrThrow<string>('S3_BUCKET');
    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: mimeType,
      }),
    );
  }

  async deleteFolder(prefix: string) {
    const bucket = this.config.getOrThrow<string>('S3_BUCKET');
    const listed = await this.s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }),
    );

    if (!listed.Contents?.length) return;

    await this.s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: listed.Contents.map(({ Key }) => ({ Key })),
        },
      }),
    );
  }

  async deleteObject(key: string) {
    const bucket = this.config.getOrThrow<string>('S3_BUCKET');
    await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600) {
    const bucket = this.config.getOrThrow<string>('S3_BUCKET');
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn },
    );
  }

  async getPresignedUploadUrl(key: string, mimeType: string, expiresIn = 300) {
    const bucket = this.config.getOrThrow<string>('S3_BUCKET');
    return getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: mimeType }),
      { expiresIn },
    );
  }
}
