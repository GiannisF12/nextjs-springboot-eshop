-- ⚠️ TEST/DEV CREDENTIALS — must be changed before the client goes live.
--
-- Simplifies the seeded login for development/testing:
--   admin / 123   (ADMIN)
--   user  / 123   (USER)
--
-- Both password_hash values are bcrypt('123', cost 10). These are weak,
-- well-known credentials: before deploying for the client, add a follow-up
-- migration that sets a strong admin password and removes the 'user' row.

-- Re-point the existing seeded admin (was admin@test.com / admin1234).
UPDATE users
SET email = 'admin',
    password_hash = '$2y$10$KM7dmW57a48Q1aEhMv/a.OULolx9E45r2jksQM6Wk4Mw4oPPX2rXC'
WHERE email = 'admin@test.com';

-- Seed a regular customer account for testing the storefront/account flow.
INSERT INTO users (email, password_hash, name, role)
VALUES (
    'user',
    '$2y$10$KM7dmW57a48Q1aEhMv/a.OULolx9E45r2jksQM6Wk4Mw4oPPX2rXC',
    'User',
    'USER'
);
