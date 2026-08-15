// Tambahan di schema.prisma
model BackupRecord {
  id        String   @id @default(cuid())
  timestamp DateTime @default(now())
  metadata  Json
  status    String   @default("pending") // pending, completed, failed
  createdAt DateTime @default(now())
}
