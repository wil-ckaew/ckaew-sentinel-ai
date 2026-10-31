CREATE TABLE IF NOT EXISTS agent_alert_states (
    agent_id VARCHAR(128) NOT NULL
        REFERENCES agents(agent_id) ON DELETE CASCADE,

    rule_key VARCHAR(100) NOT NULL,

    alert_id UUID
        REFERENCES alerts(id) ON DELETE SET NULL,

    is_active BOOLEAN NOT NULL DEFAULT FALSE,

    last_value DOUBLE PRECISION,
    threshold DOUBLE PRECISION,

    first_triggered_at TIMESTAMPTZ,
    last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recovered_at TIMESTAMPTZ,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (agent_id, rule_key)
);

CREATE INDEX IF NOT EXISTS idx_agent_alert_states_active
    ON agent_alert_states(is_active, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_alert_states_alert
    ON agent_alert_states(alert_id);
