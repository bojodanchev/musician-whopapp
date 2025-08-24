import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";
import type { StorageAdapter, SignedUrl } from "@/lib/storage/types";

export class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;

  constructor() {
    if (!env.S3_BUCKET || !env.S3_REGION) {
      throw new Error("Missing S3 configuration");
    }
    this.bucket = env.S3_BUCKET;
    this.client = new S3Client({
      region: env.S3_REGION,
      credentials: env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY ? {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      } : undefined,
    });
  }

  async putObject(params: { key: string; contentType: string; body: Buffer | Uint8Array | string }): Promise<{ key: string }> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }));
    return { key: params.key };
  }

  async getSignedUrl(params: { key: string; method?: "GET" | "PUT"; expiresInSeconds?: number; contentType?: string }): Promise<SignedUrl> {
    const method = params.method ?? "GET";
    const expires = params.expiresInSeconds ?? 300;
    const command = method === "PUT"
      ? new PutObjectCommand({ Bucket: this.bucket, Key: params.key, ContentType: params.contentType })
      : new GetObjectCommand({ Bucket: this.bucket, Key: params.key });
    const url = await awsGetSignedUrl(this.client, command, { expiresIn: expires });
    return { url, expiresAt: Math.floor(Date.now() / 1000) + expires };
  }
}

export function getStorage(): StorageAdapter {
  // For MVP, only S3 path; Supabase adapter can be added later
  return new S3StorageAdapter();
}

