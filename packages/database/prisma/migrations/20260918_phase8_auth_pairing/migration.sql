CREATE TABLE "web_sessions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text, "organization_id" TEXT NOT NULL, "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL, "expires_at" TIMESTAMP(3) NOT NULL, "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "last_seen_at" TIMESTAMP(3),
  CONSTRAINT "web_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "web_sessions_token_hash_key" ON "web_sessions"("token_hash");
CREATE INDEX "web_sessions_user_id_expires_at_idx" ON "web_sessions"("user_id", "expires_at");
CREATE TABLE "extension_pairing_challenges" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text, "organization_id" TEXT NOT NULL, "user_id" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL, "expires_at" TIMESTAMP(3) NOT NULL, "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "extension_pairing_challenges_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "extension_pairing_challenges_code_hash_key" ON "extension_pairing_challenges"("code_hash");
CREATE INDEX "extension_pairing_challenges_user_id_expires_at_idx" ON "extension_pairing_challenges"("user_id", "expires_at");
CREATE TABLE "extension_devices" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text, "organization_id" TEXT NOT NULL, "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL, "name" TEXT NOT NULL, "version" TEXT NOT NULL, "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3), "last_seen_at" TIMESTAMP(3), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "extension_devices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "extension_devices_token_hash_key" ON "extension_devices"("token_hash");
CREATE INDEX "extension_devices_user_id_expires_at_idx" ON "extension_devices"("user_id", "expires_at");
ALTER TABLE "web_sessions" ADD CONSTRAINT "web_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "web_sessions" ADD CONSTRAINT "web_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "extension_pairing_challenges" ADD CONSTRAINT "extension_pairing_challenges_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "extension_pairing_challenges" ADD CONSTRAINT "extension_pairing_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "extension_devices" ADD CONSTRAINT "extension_devices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "extension_devices" ADD CONSTRAINT "extension_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
