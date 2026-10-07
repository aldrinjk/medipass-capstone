-- Responder accountability: store short-lived verification challenges and
-- attach responder identity metadata to the patient-visible access audit.
CREATE TABLE responder_verification_challenge (
    id UUID PRIMARY KEY,
    pass_id UUID NOT NULL REFERENCES emergency_pass(id) ON DELETE CASCADE,
    responder_name VARCHAR(120) NOT NULL,
    responder_role VARCHAR(80),
    responder_organization VARCHAR(120),
    phone_e164 VARCHAR(32),
    phone_last4 VARCHAR(4),
    responder_device VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL,
    verification_method VARCHAR(32),
    verification_note VARCHAR(200),
    access_token_hash VARCHAR(64),
    attempts INTEGER NOT NULL DEFAULT 0,
    challenge_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    session_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_responder_verification_pass_id
    ON responder_verification_challenge(pass_id);

CREATE UNIQUE INDEX idx_responder_verification_access_token
    ON responder_verification_challenge(access_token_hash);

ALTER TABLE pass_access_log
    ADD COLUMN responder_name VARCHAR(120);

ALTER TABLE pass_access_log
    ADD COLUMN responder_role VARCHAR(80);

ALTER TABLE pass_access_log
    ADD COLUMN responder_organization VARCHAR(120);

ALTER TABLE pass_access_log
    ADD COLUMN responder_phone_last4 VARCHAR(4);

ALTER TABLE pass_access_log
    ADD COLUMN verification_method VARCHAR(32);

ALTER TABLE pass_access_log
    ADD COLUMN verification_note VARCHAR(200);
