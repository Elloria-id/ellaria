import sharp from 'sharp'

export class WatermarkService {
  static generateWatermarkText(userId: string, username: string, timestamp: number): string {
    const date = new Date(timestamp).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
    })
    return `ELLARIA エル | ${username} | ${date}`
  }

  static async applyWatermark(
    imageBuffer: Buffer,
    userId: string,
    username: string,
    timestamp: number
  ): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer)
      const metadata = await image.metadata()

      const watermarkText = this.generateWatermarkText(userId, username, timestamp)

      // Create SVG watermark
      const svg = `
        <svg width="${metadata.width}" height="${metadata.height}">
          <defs>
            <linearGradient id="watermark" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgba(66,165,245,0.3);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgba(66,165,245,0.1);stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="${metadata.height * 0.06}" fill="url(#watermark)" />
          <text
            x="20"
            y="${metadata.height * 0.04}"
            font-size="24"
            fill="rgba(255,255,255,0.6)"
            font-family="Arial, sans-serif"
            font-weight="bold"
          >
            ${watermarkText}
          </text>
        </svg>
      `

      return await image
        .composite([{ input: Buffer.from(svg), blend: 'over' }])
        .toBuffer()
    } catch (error) {
      // If watermark fails, return original image
      console.error('Watermark error:', error)
      return imageBuffer
    }
  }
}
