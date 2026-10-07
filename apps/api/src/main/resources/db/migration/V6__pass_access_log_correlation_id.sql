-- Audit hardening: correlate each access-log row back to the request that
-- produced it, without ever storing the raw public pass token, so patient
-- and admin views can be cross-referenced with request-level logs.
ALTER TABLE pass_access_log
    ADD COLUMN correlation_id VARCHAR(64);

CREATE INDEX idx_pass_access_log_correlation_id ON pass_access_log(correlation_id);
