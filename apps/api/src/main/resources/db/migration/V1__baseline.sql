CREATE TABLE medipass_schema_metadata (
    id INTEGER PRIMARY KEY,
    schema_version_label VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO medipass_schema_metadata (id, schema_version_label)
VALUES (1, 'baseline');
