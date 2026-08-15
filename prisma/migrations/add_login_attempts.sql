-- Add login attempts table
CREATE TABLE "login_attempts" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "identifier" TEXT NOT NULL,
  "ip_address" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_login_attempts_identifier" ON "login_attempts"("identifier");
CREATE INDEX "idx_login_attempts_created_at" ON "login_attempts"("created_at");
