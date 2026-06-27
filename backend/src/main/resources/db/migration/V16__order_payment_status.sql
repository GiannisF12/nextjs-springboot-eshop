-- Card payments: track where each order stands on payment, and the Stripe
-- Checkout session that backs a card order (so webhooks can find it).
--
-- Existing/legacy orders are COD, so they backfill to NOT_REQUIRED. The
-- default is dropped afterwards so the JPA entity must set the value
-- explicitly on every new order.
ALTER TABLE orders
    ADD COLUMN payment_status    VARCHAR(16) NOT NULL DEFAULT 'NOT_REQUIRED',
    ADD COLUMN stripe_session_id VARCHAR(255);

ALTER TABLE orders
    ALTER COLUMN payment_status DROP DEFAULT;

-- Webhooks look orders up by their Stripe session id.
CREATE INDEX idx_orders_stripe_session_id ON orders (stripe_session_id);
