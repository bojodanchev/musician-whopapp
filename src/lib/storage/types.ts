export type SignedUrl = {
  url: string;
  expiresAt: number;
};

export interface StorageAdapter {
  putObject(params: { key: string; contentType: string; body: Buffer | Uint8Array | string }): Promise<{ key: string }>;
  getSignedUrl(params: { key: string; method?: "GET" | "PUT"; expiresInSeconds?: number; contentType?: string }): Promise<SignedUrl>;
}

