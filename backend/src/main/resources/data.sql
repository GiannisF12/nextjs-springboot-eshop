-- Categories
INSERT INTO categories (name) VALUES ('Shoes')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name) VALUES ('T-Shirts')
ON CONFLICT (name) DO NOTHING;

-- Products (use category_id)
INSERT INTO products (title, price, image, category_id)
VALUES ('Nike Air Max', 129.99, 'https://picsum.photos/seed/nike/600/600',
        (SELECT id FROM categories WHERE name = 'Shoes'));

INSERT INTO products (title, price, image, category_id)
VALUES ('Basic White Tee', 19.99, 'https://picsum.photos/seed/tee/600/600',
        (SELECT id FROM categories WHERE name = 'T-Shirts'));