-- Users rename themselves now, so the name check in the service can race; the database has the final say
ALTER TABLE users
    ADD CONSTRAINT uq_users_name UNIQUE (name);
