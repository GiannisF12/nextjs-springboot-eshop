-- Adds the low-stock threshold to the singleton store_settings row.
-- The dashboard widget counts variants whose stock is at or below this
-- number; the admin settings page lets the shop owner change it
-- without touching code. Default 5 matches the most common SMB rule
-- of thumb ("less than a working week of inventory").

ALTER TABLE store_settings
    ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 5;

-- Drop default so future inserts (none expected — this table is a
-- singleton) must set it explicitly.
ALTER TABLE store_settings
    ALTER COLUMN low_stock_threshold DROP DEFAULT;
