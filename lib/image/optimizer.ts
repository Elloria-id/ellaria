import sharp from 'sharp'

export class ImageOptimizer {
  static async optimize(
    buffer: Buffer,
    options?: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'jpeg' | 'png'
    }
  ): Promise<Buffer> {
    const {
      width,
      height,
      quality = 80,
      format = 'webp',
    } = options || {}

    let image = sharp(buffer)

    if (width || height) {
      image = image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    switch (format) {
      case 'webp':
        image = image.webp({ quality })
        break
      case 'jpeg':
        image = image.jpeg({ quality })
        break
      case 'png':
        image = image.png({ quality })
        break
    }

    return await image.toBuffer()
  }

  static async getMetadata(buffer: Buffer) {
    return await sharp(buffer).metadata()
  }

  static async isImage(buffer: Buffer): Promise<boolean> {
    try {
      await this.getMetadata(buffer)
      return true
    } catch {
      return false
    }
  }
}
