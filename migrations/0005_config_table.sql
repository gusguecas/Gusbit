-- Migration: Create config table for app settings
-- Date: 2024-09-24
-- Purpose: Add configuration table for password and other app settings

CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default app password
INSERT OR IGNORE INTO config (key, value) VALUES ('app_password', 'asset123');

-- Insert app version
INSERT OR IGNORE INTO config (key, value) VALUES ('app_version', '2.0.0');

-- Insert deployment info
INSERT OR IGNORE INTO config (key, value) VALUES ('deployment_date', datetime('now'));