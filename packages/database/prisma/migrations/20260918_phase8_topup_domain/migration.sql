CREATE TABLE "funding_requests" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL,
  "reference_code" TEXT NOT NULL,
  "created_by_user_id" TEXT NOT NULL,
  "approved_by_user_id" TEXT,
  "fund_lot_id" TEXT NOT NULL,
  "target_ad_account_id" TEXT,
  "amount_minor" BIGINT NOT NULL,
  "currency_code" TEXT NOT NULL DEFAULT 'INR',
  "purpose" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "approved_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "funding_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "funding_requests_positive_amount" CHECK ("amount_minor" > 0),
  CONSTRAINT "funding_requests_inr_only" CHECK ("currency_code" = 'INR')
);

CREATE UNIQUE INDEX "funding_requests_organization_id_reference_code_key"
  ON "funding_requests"("organization_id", "reference_code");
CREATE INDEX "funding_requests_organization_id_status_created_at_idx"
  ON "funding_requests"("organization_id", "status", "created_at");
CREATE INDEX "funding_requests_fund_lot_id_status_idx"
  ON "funding_requests"("fund_lot_id", "status");

CREATE TABLE "meta_topup_sessions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL,
  "actor_user_id" TEXT NOT NULL,
  "extension_device_id" TEXT,
  "funding_request_id" TEXT,
  "fund_lot_id" TEXT NOT NULL,
  "detected_ad_account_id" TEXT,
  "selected_ad_account_id" TEXT,
  "detected_meta_account_id" TEXT,
  "visible_meta_account_id" TEXT,
  "idempotency_key" TEXT NOT NULL,
  "idempotency_fingerprint" TEXT NOT NULL,
  "detected_amount_minor" BIGINT,
  "selected_amount_minor" BIGINT,
  "detected_currency_code" TEXT,
  "selected_currency_code" TEXT NOT NULL DEFAULT 'INR',
  "funding_source_type" TEXT NOT NULL,
  "confidence" TEXT NOT NULL DEFAULT 'LOW',
  "operational_state" TEXT NOT NULL DEFAULT 'DETECTED',
  "financial_review_state" TEXT NOT NULL DEFAULT 'UNVERIFIED',
  "detector_version" TEXT NOT NULL,
  "ui_observed_at" TIMESTAMP(3),
  "reviewed_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "meta_topup_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "meta_topup_sessions_inr_only" CHECK (
    "selected_currency_code" = 'INR' AND
    ("detected_currency_code" IS NULL OR "detected_currency_code" = 'INR')
  ),
  CONSTRAINT "meta_topup_sessions_positive_amounts" CHECK (
    ("detected_amount_minor" IS NULL OR "detected_amount_minor" > 0) AND
    ("selected_amount_minor" IS NULL OR "selected_amount_minor" > 0)
  ),
  CONSTRAINT "meta_topup_sessions_funding_source" CHECK (
    ("funding_source_type" = 'FUNDING_REQUEST' AND "funding_request_id" IS NOT NULL) OR
    ("funding_source_type" = 'FUND_LOT' AND "funding_request_id" IS NULL)
  ),
  CONSTRAINT "meta_topup_sessions_idempotency_key_length" CHECK (
    char_length("idempotency_key") BETWEEN 8 AND 128
  )
);

CREATE UNIQUE INDEX "meta_topup_sessions_organization_id_idempotency_key_key"
  ON "meta_topup_sessions"("organization_id", "idempotency_key");
CREATE INDEX "meta_topup_sessions_organization_id_operational_state_created_at_idx"
  ON "meta_topup_sessions"("organization_id", "operational_state", "created_at");
CREATE INDEX "meta_topup_sessions_organization_id_financial_review_state_created_at_idx"
  ON "meta_topup_sessions"("organization_id", "financial_review_state", "created_at");
CREATE INDEX "meta_topup_sessions_selected_ad_account_id_created_at_idx"
  ON "meta_topup_sessions"("selected_ad_account_id", "created_at");

CREATE TABLE "meta_topup_events" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "extension_device_id" TEXT,
  "sequence" INTEGER NOT NULL,
  "event_type" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meta_topup_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "meta_topup_events_positive_sequence" CHECK ("sequence" > 0),
  CONSTRAINT "meta_topup_events_idempotency_key_length" CHECK (
    char_length("idempotency_key") BETWEEN 8 AND 128
  )
);

CREATE UNIQUE INDEX "meta_topup_events_session_id_sequence_key"
  ON "meta_topup_events"("session_id", "sequence");
CREATE UNIQUE INDEX "meta_topup_events_organization_id_idempotency_key_key"
  ON "meta_topup_events"("organization_id", "idempotency_key");
CREATE INDEX "meta_topup_events_organization_id_session_id_created_at_idx"
  ON "meta_topup_events"("organization_id", "session_id", "created_at");

CREATE TABLE "topup_reservations" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "fund_lot_id" TEXT NOT NULL,
  "funding_request_id" TEXT,
  "amount_minor" BIGINT NOT NULL,
  "currency_code" TEXT NOT NULL DEFAULT 'INR',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "released_at" TIMESTAMP(3),
  "confirmed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "topup_reservations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "topup_reservations_positive_amount" CHECK ("amount_minor" > 0),
  CONSTRAINT "topup_reservations_inr_only" CHECK ("currency_code" = 'INR')
);

CREATE UNIQUE INDEX "topup_reservations_session_id_key"
  ON "topup_reservations"("session_id");
CREATE INDEX "topup_reservations_organization_id_status_expires_at_idx"
  ON "topup_reservations"("organization_id", "status", "expires_at");
CREATE INDEX "topup_reservations_fund_lot_id_status_expires_at_idx"
  ON "topup_reservations"("fund_lot_id", "status", "expires_at");

ALTER TABLE "funding_requests"
  ADD CONSTRAINT "funding_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "funding_requests_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "funding_requests_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "funding_requests_fund_lot_id_fkey" FOREIGN KEY ("fund_lot_id") REFERENCES "fund_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "funding_requests_target_ad_account_id_fkey" FOREIGN KEY ("target_ad_account_id") REFERENCES "ad_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "meta_topup_sessions"
  ADD CONSTRAINT "meta_topup_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "meta_topup_sessions_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "meta_topup_sessions_extension_device_id_fkey" FOREIGN KEY ("extension_device_id") REFERENCES "extension_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "meta_topup_sessions_funding_request_id_fkey" FOREIGN KEY ("funding_request_id") REFERENCES "funding_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "meta_topup_sessions_fund_lot_id_fkey" FOREIGN KEY ("fund_lot_id") REFERENCES "fund_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "meta_topup_sessions_detected_ad_account_id_fkey" FOREIGN KEY ("detected_ad_account_id") REFERENCES "ad_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "meta_topup_sessions_selected_ad_account_id_fkey" FOREIGN KEY ("selected_ad_account_id") REFERENCES "ad_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "meta_topup_events"
  ADD CONSTRAINT "meta_topup_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "meta_topup_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "meta_topup_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "meta_topup_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "meta_topup_events_extension_device_id_fkey" FOREIGN KEY ("extension_device_id") REFERENCES "extension_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "topup_reservations"
  ADD CONSTRAINT "topup_reservations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "topup_reservations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "meta_topup_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "topup_reservations_fund_lot_id_fkey" FOREIGN KEY ("fund_lot_id") REFERENCES "fund_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "topup_reservations_funding_request_id_fkey" FOREIGN KEY ("funding_request_id") REFERENCES "funding_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
