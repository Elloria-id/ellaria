import { StorageProvider } from './StorageProvider'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const mkdir = promisify(fs.mkdir)
const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string
  private baseUrl: string

  constructor() {
    this.baseDir = path.join(process.cwd(), 'public', 'uploads')
    this.baseUrl = '/uploads'
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true })
    }
  }

  async upload(key: string, data: Buffer, mimeType: string): Promise<string> {
    const fullPath = path.join(this.baseDir, key)
    const dir = path.dirname(fullPath)

    if (!fs.existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }

    await writeFile(fullPath, data)
    return `${this.baseUrl}/${key}`
  }

  async getUrl(key: string, signed?: boolean): Promise<string> {
    return `${this.baseUrl}/${key}`
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.baseDir, key)
    if (fs.existsSync(fullPath)) {
      await unlink(fullPath)
    }
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    return this.getUrl(key, false)
  }
      }
