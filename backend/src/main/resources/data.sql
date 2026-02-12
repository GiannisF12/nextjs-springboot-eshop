-- Categories
INSERT INTO categories (name) VALUES ('Shoes')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name) VALUES ('T-Shirts')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name) VALUES ('Hoodies')
ON CONFLICT (name) DO NOTHING;

-- Products (use category_id)
INSERT INTO products (title, price, image, category_id)
VALUES ('Nike Air Max', 129.99, '/products/nike-air-max.jpg',
        (SELECT id FROM categories WHERE name = 'Shoes'));

INSERT INTO products (title, price, image, category_id)
VALUES ('Basic White Tee', 19.99, '/products/basic-tee.jpg',
        (SELECT id FROM categories WHERE name = 'T-Shirts'));

INSERT INTO products (title, price, image, category_id)
VALUES ('Basic Hoodie', 49.99, '/products/hoodie.jpg',
        (SELECT id FROM categories WHERE name = 'Hoodies'));


INSERT INTO users (email, password_hash, role)
VALUES ('admin@test.com', '$2y$10$cW33NXY9tdnqKF3HlzeNVukzIQPHQYMFSBAs5..MDWcOlrReqg7gy', 'ADMIN')
ON CONFLICT (email) DO NOTHING;