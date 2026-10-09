CREATE TABLE pass_access_log (
    id UUID PRIMARY KEY,
    pass_id UUID REFERENCES emergency_pass(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    outcome VARCHAR(20) NOT NULL,
    accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_pass_access_log_outcome
        CHECK (outcome IN ('SUCCESS', 'EXPIRED', 'REVOKED', 'INVALID'))
);

CREATE INDEX idx_pass_access_log_user_id ON pass_access_log(user_id);
CREATE INDEX idx_pass_access_log_pass_id ON pass_access_log(pass_id);
CREATE INDEX idx_pass_access_log_accessed_at ON pass_access_log(accessed_at);
