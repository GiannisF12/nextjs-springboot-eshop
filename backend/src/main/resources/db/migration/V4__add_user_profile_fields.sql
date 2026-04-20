-- V4__add_user_profile_fields.sql
-- Adds optional profile fields (gender, birthday) to the users table.
-- Nullable so existing users remain valid until they fill them in.

ALTER TABLE users
    ADD COLUMN gender   VARCHAR(32),
    ADD COLUMN birthday DATE;

ALTER TABLE users
    ADD CONSTRAINT users_gender_check
        CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'));
