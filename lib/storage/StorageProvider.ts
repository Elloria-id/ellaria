export interface StorageProvider {
  upload(key: string, data: Buffer, mimeType: string): Promise<string>
  getUrl(key: string, signed?: boolean): Promise<string>
  delete(key: string): Promise<void>
  getSignedUrl(key: string, expiresIn?: number): Promise<string>
}
