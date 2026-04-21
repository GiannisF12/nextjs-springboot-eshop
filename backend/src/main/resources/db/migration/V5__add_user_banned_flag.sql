-- V5: Add a `banned` flag so admins can lock user accounts without
-- deleting them. Deletion would orphan orders and break the admin
-- analytics (top products, revenue) — banning preserves history while
-- preventing the user from authenticating again.

ALTER TABLE users
    ADD COLUMN banned BOOLEAN NOT NULL DEFAULT FALSE;
