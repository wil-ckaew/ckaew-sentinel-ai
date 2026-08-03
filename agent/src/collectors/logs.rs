use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use std::path::Path;
use regex::Regex;
use chrono::Utc;
use std::collections::HashMap;

use crate::models::{SecurityLog, LogSeverity};

pub struct LogCollector {
    watched_files: Vec<WatchedFile>,
    patterns: Vec<LogPattern>,
}

struct WatchedFile {
    path: String,
    position: u64,
    max_size: u64,
}

struct LogPattern {
    pattern: Regex,
    severity: LogSeverity,
    event_type: String,
}

impl LogCollector {
    pub fn new() -> Self {
        let mut collector = Self {
            watched_files: Vec::new(),
            patterns: Vec::new(),
        };
        
        // Adicionar padrões comuns de logs de segurança
        collector.add_patterns();
        collector
    }

    fn add_patterns(&mut self) {
        // Padrão de falha de login
        self.patterns.push(LogPattern {
            pattern: Regex::new(r"(?i)FAILED (LOGIN|AUTH|PASSWORD)").unwrap(),
            severity: LogSeverity::Warning,
            event_type: "FAILED_LOGIN".to_string(),
        });

        // Padrão de acesso root
        self.patterns.push(LogPattern {
            pattern: Regex::new(r"(?i)ROOT LOGIN|SUDO|SU").unwrap(),
            severity: LogSeverity::Info,
            event_type: "PRIVILEGED_ACCESS".to_string(),
        });

        // Padrão de possível ataque
        self.patterns.push(LogPattern {
            pattern: Regex::new(r"(?i)ATTACK|INTRUSION|EXPLOIT|UNAUTHORIZED").unwrap(),
            severity: LogSeverity::Critical,
            event_type: "SUSPICIOUS_ACTIVITY".to_string(),
        });

        // Padrão de erro de firewall
        self.patterns.push(LogPattern {
            pattern: Regex::new(r"(?i)FIREWALL.*BLOCK|DROP|DENY").unwrap(),
            severity: LogSeverity::Error,
            event_type: "FIREWALL_BLOCK".to_string(),
        });

        // Padrão de malware
        self.patterns.push(LogPattern {
            pattern: Regex::new(r"(?i)MALWARE|VIRUS|TROJAN|RANSOMWARE").unwrap(),
            severity: LogSeverity::Critical,
            event_type: "MALWARE_DETECTED".to_string(),
        });
    }

    pub fn watch_file(&mut self, path: String, max_size: u64) {
        self.watched_files.push(WatchedFile {
            path,
            position: 0,
            max_size,
        });
    }

    pub fn collect_logs(&mut self) -> Vec<SecurityLog> {
        let mut logs = Vec::new();

        for watched in &mut self.watched_files {
            if let Ok(mut collected) = self.process_watched_file(watched) {
                logs.append(&mut collected);
            }
        }

        logs
    }

    fn process_watched_file(&self, watched: &mut WatchedFile) -> Result<Vec<SecurityLog>, std::io::Error> {
        let path = Path::new(&watched.path);
        if !path.exists() {
            return Ok(Vec::new());
        }

        let file = File::open(path)?;
        let metadata = file.metadata()?;
        let file_size = metadata.len();

        // Se o arquivo foi rotacionado, resetar posição
        if file_size < watched.position {
            watched.position = 0;
        }

        // Se o arquivo cresceu além do limite, ajustar posição
        if file_size > watched.max_size && file_size - watched.position > watched.max_size {
            watched.position = file_size - watched.max_size;
        }

        let mut reader = BufReader::new(file);
        reader.seek(SeekFrom::Start(watched.position))?;

        let mut logs = Vec::new();
        let mut lines_read = 0;
        let mut current_position = watched.position;

        for line in reader.lines() {
            let line = line?;
            lines_read += 1;
            current_position += line.len() as u64 + 1; // +1 for newline

            // Analisar linha
            if let Some(log) = self.analyze_line(&line) {
                logs.push(log);
            }

            // Limitar número de linhas para não sobrecarregar
            if lines_read > 10000 {
                break;
            }
        }

        watched.position = current_position;
        Ok(logs)
    }

    fn analyze_line(&self, line: &str) -> Option<SecurityLog> {
        // Primeiro, tentar identificar padrões conhecidos
        for pattern in &self.patterns {
            if pattern.pattern.is_match(line) {
                return Some(SecurityLog {
                    event_type: pattern.event_type.clone(),
                    severity: pattern.severity.clone(),
                    message: line.to_string(),
                    source_ip: self.extract_ip(line),
                    details: self.extract_details(line),
                    timestamp: Utc::now(),
                });
            }
        }

        // Se não encontrou padrão, mas é um log (contém palavras-chave comuns)
        if self.is_likely_log(line) {
            Some(SecurityLog {
                event_type: "SYSTEM_LOG".to_string(),
                severity: self.guess_severity(line),
                message: line.to_string(),
                source_ip: self.extract_ip(line),
                details: self.extract_details(line),
                timestamp: Utc::now(),
            })
        } else {
            None
        }
    }

    fn is_likely_log(&self, line: &str) -> bool {
        let log_keywords = vec![
            "log", "error", "warning", "info", "debug", "trace",
            "fail", "success", "access", "connect", "disconnect",
        ];
        
        let line_lower = line.to_lowercase();
        log_keywords.iter().any(|kw| line_lower.contains(kw))
    }

    fn guess_severity(&self, line: &str) -> LogSeverity {
        let line_lower = line.to_lowercase();
        
        if line_lower.contains("critical") || line_lower.contains("emergency") {
            LogSeverity::Critical
        } else if line_lower.contains("error") || line_lower.contains("fail") {
            LogSeverity::Error
        } else if line_lower.contains("warning") || line_lower.contains("warn") {
            LogSeverity::Warning
        } else {
            LogSeverity::Info
        }
    }

    fn extract_ip(&self, text: &str) -> Option<String> {
        let ip_pattern = Regex::new(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b").unwrap();
        ip_pattern.find(text).map(|m| m.as_str().to_string())
    }

    fn extract_details(&self, text: &str) -> HashMap<String, serde_json::Value> {
        let mut details = HashMap::new();
        
        // Extrair data/hora se presente
        let datetime_pattern = Regex::new(r"\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}").unwrap();
        if let Some(dt) = datetime_pattern.find(text) {
            details.insert("timestamp".to_string(), 
                serde_json::Value::String(dt.as_str().to_string()));
        }

        // Extrair PID se presente
        let pid_pattern = Regex::new(r"\[(\d+)\]").unwrap();
        if let Some(caps) = pid_pattern.captures(text) {
            if let Some(pid) = caps.get(1) {
                details.insert("pid".to_string(), 
                    serde_json::Value::String(pid.as_str().to_string()));
            }
        }

        details
    }
}

impl Default for LogCollector {
    fn default() -> Self {
        Self::new()
    }
}
