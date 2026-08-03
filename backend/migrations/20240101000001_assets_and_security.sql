-- Criar tipos ENUM para ativos
CREATE TYPE asset_type AS ENUM (
    'server',
    'workstation',
    'network_device',
    'database',
    'cloud_instance',
    'container',
    'iot_device',
    'firewall'
);

CREATE TYPE asset_status AS ENUM (
    'active',
    'inactive',
    'maintenance',
    'compromised',
    'decommissioned'
);

CREATE TYPE criticality AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TYPE log_severity AS ENUM (
    'info',
    'warning',
    'error',
    'critical'
);

-- Tabela de ativos
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45) NOT NULL,
    asset_type asset_type NOT NULL,
    status asset_status NOT NULL DEFAULT 'active',
    criticality criticality NOT NULL DEFAULT 'medium',
    location VARCHAR(255),
    department VARCHAR(100),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE
);

-- Índices para assets
CREATE INDEX idx_assets_ip_address ON assets(ip_address);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_criticality ON assets(criticality);
CREATE INDEX idx_assets_owner ON assets(owner_id);

-- Tabela de vulnerabilidades
CREATE TYPE vulnerability_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TYPE vulnerability_status AS ENUM (
    'open',
    'in_progress',
    'mitigated',
    'accepted',
    'closed'
);

CREATE TABLE vulnerabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    cve_id VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity vulnerability_severity NOT NULL,
    cvss_score DECIMAL(3,1),
    status vulnerability_status NOT NULL DEFAULT 'open',
    detection_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_date TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    remediation_steps TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para vulnerabilidades
CREATE INDEX idx_vulnerabilities_asset ON vulnerabilities(asset_id);
CREATE INDEX idx_vulnerabilities_severity ON vulnerabilities(severity);
CREATE INDEX idx_vulnerabilities_status ON vulnerabilities(status);
CREATE INDEX idx_vulnerabilities_cve ON vulnerabilities(cve_id);

-- Tabela de logs de segurança
CREATE TABLE security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    severity log_severity NOT NULL,
    message TEXT NOT NULL,
    source_ip VARCHAR(45),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para logs
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at DESC);
CREATE INDEX idx_security_logs_severity ON security_logs(severity);
CREATE INDEX idx_security_logs_asset ON security_logs(asset_id);
CREATE INDEX idx_security_logs_user ON security_logs(user_id);

-- Tabela de alertas
CREATE TYPE alert_status AS ENUM (
    'new',
    'investigating',
    'escalated',
    'resolved',
    'false_positive'
);

CREATE TYPE alert_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority alert_priority NOT NULL,
    status alert_status NOT NULL DEFAULT 'new',
    source_ip VARCHAR(45),
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para alertas
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_asset ON alerts(asset_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
