import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

// Cloudflare R2 is S3-compatible, so we use AWS SDK
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET_NAME = env.CLOUDFLARE_R2_BUCKET_NAME;
export const R2_PUBLIC_URL = env.CLOUDFLARE_R2_PUBLIC_URL;
