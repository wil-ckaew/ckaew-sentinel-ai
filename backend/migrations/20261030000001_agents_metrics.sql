CREATE TABLE IF NOT EXISTS agents (
    agent_id VARCHAR(128) PRIMARY KEY,
    hostname VARCHAR(255) NOT NULL,
    operating_system VARCHAR(100) NOT NULL DEFAULT 'unknown',
    kernel_version TEXT NOT NULL DEFAULT 'unknown',
    cpu_cores INTEGER NOT NULL DEFAULT 0,
    total_memory BIGINT NOT NULL DEFAULT 0,
    uptime BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'online',
    first_seen TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agents_last_seen
    ON agents(last_seen DESC);

CREATE TABLE IF NOT EXISTS agent_metrics (
    id BIGSERIAL PRIMARY KEY,
    agent_id VARCHAR(128) NOT NULL
        REFERENCES agents(agent_id) ON DELETE CASCADE,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cpu_usage DOUBLE PRECISION NOT NULL DEFAULT 0,
    memory_usage DOUBLE PRECISION NOT NULL DEFAULT 0,
    load_average JSONB NOT NULL DEFAULT '[]'::jsonb,
    disk_usage JSONB NOT NULL DEFAULT '[]'::jsonb,
    network_usage JSONB NOT NULL DEFAULT '[]'::jsonb,
    processes JSONB NOT NULL DEFAULT '[]'::jsonb,
    system_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_metrics JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_date
    ON agent_metrics(agent_id, collected_at DESC);
