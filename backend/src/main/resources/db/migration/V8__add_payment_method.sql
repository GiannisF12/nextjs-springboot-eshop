-- Adds payment_method to orders. Existing rows backfill to COD —
-- before this migration there was no online payment, so every prior
-- order was effectively cash on delivery.
--
-- Stripe support arrives in a later phase; the column already accepts
-- 'STRIPE' so we won't need another migration when it lands.

ALTER TABLE orders
    ADD COLUMN payment_method VARCHAR(16) NOT NULL DEFAULT 'COD';

-- Drop the default once the backfill is done so new rows must set it
-- explicitly (the JPA entity will). Keeps the column honest.
ALTER TABLE orders
    ALTER COLUMN payment_method DROP DEFAULT;
