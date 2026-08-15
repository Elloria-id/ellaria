import { StorageProvider } from './StorageProvider'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export class R2StorageProvider implements StorageProvider {
  private client: S3Client
  private bucket: string
  private publicUrl: string

  constructor() {
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      throw new Error('R2 credentials not configured')
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })

    this.bucket = process.env.R2_BUCKET_NAME || 'ellaria'
    this.publicUrl = process.env.R2_PUBLIC_URL || ''
  }

  async upload(key: string, data: Buffer, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: mimeType,
    })

    await this.client.send(command)
    return this.publicUrl ? `${this.publicUrl}/${key}` : `https://${this.bucket}.r2.cloudflarestorage.com/${key}`
  }

  async getUrl(key: string, signed?: boolean): Promise<string> {
    if (signed) {
      return this.getSignedUrl(key)
    }
    return this.publicUrl ? `${this.publicUrl}/${key}` : `https://${this.bucket}.r2.cloudflarestorage.com/${key}`
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })
    await this.client.send(command)
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })
    return await getSignedUrl(this.client, command, { expiresIn })
  }
}
