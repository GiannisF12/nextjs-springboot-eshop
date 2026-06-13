-- Couriers the admin can offer at checkout. The catalog (which couriers
-- exist) is seeded here in code; the admin edits price + availability from
-- the panel. BOX NOW / lockers are intentionally out of scope for now.
CREATE TABLE couriers (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100)   NOT NULL UNIQUE,
    price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    enabled     BOOLEAN        NOT NULL DEFAULT TRUE,
    sort_order  INT            NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Placeholder prices — the client adjusts these from the admin panel.
-- ACS is sort_order 0 so it is the default selection at checkout.
INSERT INTO couriers (name, price, enabled, sort_order) VALUES
    ('ACS Courier',        3.00, TRUE, 0),
    ('ELTA Courier',       2.50, TRUE, 1),
    ('Geniki Taxydromiki', 3.50, TRUE, 2),
    ('Speedex',            3.00, TRUE, 3);
