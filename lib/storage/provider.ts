import type { StorageProvider } from './StorageProvider'
import { LocalStorageProvider } from './LocalStorage'
import { R2StorageProvider } from './R2Storage'

let storageProvider: StorageProvider | undefined

export function getStorageProvider(): StorageProvider {
  if (storageProvider) {
    return storageProvider
  }

  if (process.env.STORAGE_PROVIDER === 'r2') {
    try {
      storageProvider = new R2StorageProvider()
    } catch {
      storageProvider = new LocalStorageProvider()
    }
  } else {
    storageProvider = new LocalStorageProvider()
  }

  return storageProvider
}