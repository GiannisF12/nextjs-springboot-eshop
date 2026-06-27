-- Couriers (V11) replaced the single flat shipping rate: each courier now
-- carries its own price, chosen by the customer at checkout. The
-- store_settings.shipping_flat_rate column is no longer read by anything,
-- so drop it. The global free_shipping_threshold stays — it still applies
-- on top of every courier price.
ALTER TABLE store_settings
    DROP COLUMN shipping_flat_rate;
