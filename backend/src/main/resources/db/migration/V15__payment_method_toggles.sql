-- Admin on/off toggles for payment methods, on the singleton store_settings
-- row. COD is on by default. Card stays off until the Stripe integration
-- ships and eshop.payments.card-available is flipped on (Phase 1) — until
-- then card shows as "Coming soon" at checkout regardless of this flag.
ALTER TABLE store_settings
    ADD COLUMN cod_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN card_enabled BOOLEAN NOT NULL DEFAULT FALSE;
