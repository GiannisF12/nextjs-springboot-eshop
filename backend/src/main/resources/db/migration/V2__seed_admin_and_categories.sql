-- V2__seed_admin_and_categories.sql
-- System seed data: initial admin account and default categories.
-- Business data (products, customer orders, etc.) is NOT seeded here —
-- it is managed by the shop owner via the admin dashboard.

-- Default admin account (password: admin1234)
INSERT INTO users (email, password_hash, name, role)
VALUES (
    'admin@test.com',
    '$2y$10$cW33NXY9tdnqKF3HlzeNVukzIQPHQYMFSBAs5..MDWcOlrReqg7gy',
    'Admin',
    'ADMIN'
);

-- Default categories so the admin can immediately create products
INSERT INTO categories (name) VALUES ('Shoes');
INSERT INTO categories (name) VALUES ('T-Shirts');
INSERT INTO categories (name) VALUES ('Hoodies');
