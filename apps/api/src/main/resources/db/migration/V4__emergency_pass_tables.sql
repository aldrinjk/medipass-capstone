CREATE TABLE emergency_pass (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_emergency_pass_status
        CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED'))
);

CREATE TABLE emergency_pass_scope (
    pass_id UUID NOT NULL REFERENCES emergency_pass(id) ON DELETE CASCADE,
    category VARCHAR(40) NOT NULL,
    PRIMARY KEY (pass_id, category),
    CONSTRAINT chk_emergency_pass_scope_category
        CHECK (category IN (
            'DEMOGRAPHICS',
            'ALLERGIES',
            'MEDICATIONS',
            'CONDITIONS',
            'EMERGENCY_CONTACT'
        ))
);

CREATE INDEX idx_emergency_pass_user_id ON emergency_pass(user_id);
CREATE INDEX idx_emergency_pass_expires_at ON emergency_pass(expires_at);
CREATE INDEX idx_emergency_pass_status ON emergency_pass(status);
