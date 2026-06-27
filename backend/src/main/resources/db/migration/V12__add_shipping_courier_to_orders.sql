-- Snapshot of the courier the customer chose, by name. Nullable: legacy
-- orders placed before this feature have none. Snapshot (not FK) so the
-- order keeps reading correctly even if a courier is renamed/removed later.
ALTER TABLE orders
    ADD COLUMN shipping_courier VARCHAR(100);
