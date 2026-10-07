-- Self-hosted Android SMS relay used by the capstone prototype.
-- The relay receives only destination/message data needed to deliver an OTP;
-- no patient clinical data is placed in this queue.
CREATE TABLE sms_relay_job (
    id UUID PRIMARY KEY,
    challenge_id UUID NOT NULL UNIQUE
        REFERENCES responder_verification_challenge(id) ON DELETE CASCADE,
    destination_e164 VARCHAR(32),
    destination_last4 VARCHAR(4) NOT NULL,
    message_body VARCHAR(240),
    otp_hash VARCHAR(100),
    status VARCHAR(20) NOT NULL,
    claim_attempts INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    last_error VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sms_relay_job_status_expiry
    ON sms_relay_job(status, expires_at);

CREATE INDEX idx_sms_relay_job_created_at
    ON sms_relay_job(created_at);
