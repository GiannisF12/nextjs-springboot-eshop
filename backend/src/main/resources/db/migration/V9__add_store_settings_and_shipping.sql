-- Adds two related things in one migration because they ship together:
--
-- 1) A `store_settings` table (singleton — id = 1 forever) holding the
--    knobs the admin should be able to turn live without redeploys:
--    shipping flat rate and free-shipping threshold for now. We'll
--    extend the same table later with store name, currency, banner,
--    etc., so this is the foundation rather than an env var.
--
-- 2) A `shipping_cost` snapshot column on orders. Snapshot, because if
--    the admin changes the rate after an order is placed, the historical
--    order should still display the price the customer actually paid.

CREATE TABLE store_settings (
    id BIGINT PRIMARY KEY,
    shipping_flat_rate       NUMERIC(10, 2) NOT NULL,
    free_shipping_threshold  NUMERIC(10, 2) NOT NULL,
    updated_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Sensible defaults for a Greek shop: €3.50 courier fee, free shipping
-- once the cart hits €50. Admin can change either of these from the
-- /admin/settings page once we ship the UI.
INSERT INTO store_settings (id, shipping_flat_rate, free_shipping_threshold)
VALUES (1, 3.50, 50.00);

ALTER TABLE orders
    ADD COLUMN shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- Backfill done; drop the default so new inserts must set the value
-- explicitly (which the JPA entity does).
ALTER TABLE orders
    ALTER COLUMN shipping_cost DROP DEFAULT;
