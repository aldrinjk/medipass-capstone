-- Add a server-generated access trace and a privacy-conscious responder
-- device label to each public-pass audit entry. Existing rows remain nullable.
ALTER TABLE pass_access_log
    ADD COLUMN trace_code VARCHAR(32),
    ADD COLUMN responder_device VARCHAR(120);

CREATE UNIQUE INDEX idx_pass_access_log_trace_code
    ON pass_access_log(trace_code)
    WHERE trace_code IS NOT NULL;
