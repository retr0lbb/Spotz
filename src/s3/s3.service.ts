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

@Injectable()
export class S3Service {
  constructor(@Inject(S3_CLIENT) private readonly s3: S3Client) {}

  async upload(bucket: string, key: string, body: Buffer, mimeType: string) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: mimeType,
      }),
    );
  }

  async deleteFolder(bucket: string, prefix: string) {
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

  async deleteBucket(bucket: string, key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  async getPresignedUrl(bucket: string, key: string, expiresIn = 3600) {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn },
    );
  }

  async getPresignedUploadUrl(
    bucket: string,
    key: string,
    mimeType: string,
    expiresIn = 300,
  ) {
    return getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: mimeType }),
      { expiresIn },
    );
  }
}
