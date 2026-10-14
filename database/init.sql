-- ============================================
-- DevLabHub Monitoring Database Schema
-- ============================================

-- ============================================
-- Tables
-- ============================================

-- Containers / Pods monitoring
CREATE TABLE IF NOT EXISTS pods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image VARCHAR(512),
    status VARCHAR(50) NOT NULL,
    ports TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resource usage metrics (CPU, memory, disk)
CREATE TABLE IF NOT EXISTS resource_metrics (
    id SERIAL PRIMARY KEY,
    pod_id INTEGER REFERENCES pods(id) ON DELETE CASCADE,
    cpu_percent NUMERIC(5,2),
    memory_used_bytes BIGINT,
    memory_total_bytes BIGINT,
    disk_used_bytes BIGINT,
    disk_total_bytes BIGINT,
    read_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Access logs (IP, user, date, etc.)
CREATE TABLE IF NOT EXISTS access_logs (
    id SERIAL PRIMARY KEY,
    pod_id INTEGER REFERENCES pods(id) ON DELETE CASCADE,
    ip_address INET,
    user_name VARCHAR(255),
    auth_method VARCHAR(50),
    port INTEGER,
    session_id VARCHAR(100),
    failed_count INTEGER DEFAULT 0,
    successful_count INTEGER DEFAULT 0,
    first_access TIMESTAMP,
    last_access TIMESTAMP,
    total_access INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (pod_id, ip_address, auth_method)
);

-- Threat predictions / anomaly detection
CREATE TABLE IF NOT EXISTS threat_predictions (
    id SERIAL PRIMARY KEY,
    pod_id INTEGER REFERENCES pods(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    threat_level VARCHAR(20), -- low, medium, high, critical
    score INTEGER, -- 0-100
    reason TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warnings / alerts
CREATE TABLE IF NOT EXISTS warnings (
    id SERIAL PRIMARY KEY,
    pod_id INTEGER REFERENCES pods(id) ON DELETE CASCADE,
    type VARCHAR(50), -- resource, security, health, etc.
    message TEXT,
    severity VARCHAR(20), -- low, medium, high, critical
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pods_status ON pods(status);
CREATE INDEX IF NOT EXISTS idx_access_pod ON access_logs(pod_id);
CREATE INDEX IF NOT EXISTS idx_access_ip ON access_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_access_time ON access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_resource_pod ON resource_metrics(pod_id);
CREATE INDEX IF NOT EXISTS idx_resource_time ON resource_metrics(read_time);
CREATE INDEX IF NOT EXISTS idx_threat_ip ON threat_predictions(ip_address);
CREATE INDEX IF NOT EXISTS idx_threat_level ON threat_predictions(threat_level);
CREATE INDEX IF NOT EXISTS idx_warnings_ack ON warnings(acknowledged);

-- ============================================
-- Sample Data (for testing)
-- ============================================

-- Sample pods
INSERT INTO pods (name, image, status, ports) VALUES
('portfolio-api', 'ghcr.io/syarifudinyoga/portfolio-backend:1.0.0', 'Up 2 days', ARRAY['127.0.0.1:3004->3004/tcp']),
('portfolio-frontend', 'ghcr.io/syarifudinyoga/portfolio-frontend:1.0.0', 'Up 11 hours', ARRAY['127.0.0.1:3005->80/tcp']),
('barbersip-frontend', 'ghcr.io/syarifudinyoga/barbersip-frontend:2.0.0', 'Up 11 hours', ARRAY['127.0.0.1:3000->3000/tcp']),
('api', 'ghcr.io/syarifudinyoga/barbersip-backend-api:2.0.0', 'Up 11 hours', ARRAY['0.0.0.0:3001->3001/tcp']),
('devlabhub-telegram-bot', 'ghcr.io/syarifudinyoga/devlabhub-telegram-bot:3', 'Up 42 min (healthy)', ARRAY['127.0.0.1:3006->3006/tcp']),
('node-exporter', '', 'Up 9 days', ARRAY[]),
('prometheus', 'docker.io/prom/prometheus:latest', 'Up 9 days', ARRAY['127.0.0.1:9090->9090/tcp']),
('grafana', 'docker.io/grafana/grafana:latest', 'Up 9 days', ARRAY['100.87.90.67:3002->3000/tcp']),
('postgres', 'docker.io/library/postgres:16-alpine', 'Up 44 hours', ARRAY['127.0.0.1:5432->5432/tcp']),
('minio', 'cgr.dev/chainguard/minio:latest', 'Up 44 hours', ARRAY['127.0.0.1:9000-9001->9000-9001/tcp']);

-- Sample access logs (from SSH auth.log - limited)
INSERT INTO access_logs (pod_id, ip_address, user_name, auth_method, successful_count, total_access, first_access, last_access)
SELECT 
    p.id,
    CASE 
        WHEN p.name = 'devlabhub-telegram-bot' THEN '100.120.175.90'
        ELSE '192.168.100.6'
    END,
    'devlabhub',
    'publickey',
    CASE 
        WHEN p.name = 'devlabhub-telegram-bot' THEN 75
        ELSE 4
    END,
    CASE 
        WHEN p.name = 'devlabhub-telegram-bot' THEN 75
        ELSE 4
    END,
    NOW() - INTERVAL '1 day',
    NOW()
FROM pods p
WHERE p.name IN ('devlabhub-telegram-bot', 'portfolio-api');

-- Threat predictions (sample data)
INSERT INTO threat_predictions (pod_id, ip_address, threat_level, score, reason)
SELECT 
    p.id,
    CASE 
        WHEN p.name = 'devlabhub-telegram-bot' THEN '100.120.175.90'
        ELSE '192.168.100.6'
    END,
    CASE 
        WHEN p.name = 'devlabhub-telegram-bot' THEN 'high'
        ELSE 'low'
    END,
    CASE 
        WHEN p.name = 'devlabhub-telegram-bot' THEN 75
        ELSE 10
    END,
    CASE 
        WHEN p.name = 'devlabhub-telegram-bot' THEN 'High SSH access rate from external IP'
        ELSE 'Normal internal network access'
    END
FROM pods p
WHERE p.name IN ('devlabhub-telegram-bot', 'portfolio-api');

-- Resource warnings (sample data)
INSERT INTO warnings (pod_id, type, message, severity)
SELECT 
    p.id,
    'resource',
    'CPU usage above 80% threshold',
    CASE 
        WHEN p.name = 'portfolio-api' THEN 'high'
        ELSE 'low'
    END
FROM pods p
WHERE p.name = 'portfolio-api';
