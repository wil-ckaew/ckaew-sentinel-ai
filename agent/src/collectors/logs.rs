use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use std::path::Path;

use chrono::Utc;
use regex::Regex;

use crate::models::{LogSeverity, SecurityLog};

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

        collector.add_patterns();
        collector
    }

    fn add_patterns(&mut self) {
        self.patterns.push(LogPattern {
            pattern: Regex::new(r"(?i)FAILED (LOGIN|AUTH|PASSWORD)").unwrap(),
            severity: LogSeverity::Warning,
            event_type: "FAILED_LOGIN".to_string(),
        });

        self.patterns.push(LogPattern {
            pattern: Regex::new(r"(?i)ROOT LOGIN|SUDO|\bsu\b").unwrap(),
            severity: LogSeverity::Info,
            event_type: "PRIVILEGED_ACCESS".to_string(),
        });

        self.patterns.push(LogPattern {
            pattern: Regex::new(r"(?i)ATTACK|INTRUSION|EXPLOIT|UNAUTHORIZED").unwrap(),
            severity: LogSeverity::Critical,
            event_type: "SUSPICIOUS_ACTIVITY".to_string(),
        });

        self.patterns.push(LogPattern {
            pattern: Regex::new(r"(?i)FIREWALL.*BLOCK|\bDROP\b|\bDENY\b").unwrap(),
            severity: LogSeverity::Error,
            event_type: "FIREWALL_BLOCK".to_string(),
        });

        self.patterns.push(LogPattern {
            pattern: Regex::new(r"(?i)MALWARE|VIRUS|TROJAN|RANSOMWARE").unwrap(),
            severity: LogSeverity::Critical,
            event_type: "MALWARE_DETECTED".to_string(),
        });
    }

    pub fn watch_file(&mut self, path: String, max_size: u64) {
        // Começar do final do arquivo evita reenviar todo o histórico
        // do sistema na primeira inicialização do agente.
        let position = fs::metadata(&path)
            .map(|metadata| metadata.len())
            .unwrap_or(0);

        self.watched_files.push(WatchedFile {
            path,
            position,
            max_size: max_size.max(1),
        });
    }

    pub fn collect_logs(&mut self) -> Vec<SecurityLog> {
        let mut logs = Vec::new();

        // Separar os empréstimos de patterns e watched_files
        // evita o conflito de empréstimo do compilador Rust.
        let patterns = &self.patterns;
        let watched_files = &mut self.watched_files;

        for watched in watched_files {
            match Self::process_watched_file(patterns, watched) {
                Ok(mut collected) => logs.append(&mut collected),
                Err(error) => {
                    log::warn!("Não foi possível ler {}: {}", watched.path, error);
                }
            }
        }

        logs
    }

    fn process_watched_file(
        patterns: &[LogPattern],
        watched: &mut WatchedFile,
    ) -> Result<Vec<SecurityLog>, std::io::Error> {
        let path = Path::new(&watched.path);

        if !path.exists() {
            return Ok(Vec::new());
        }

        let file = File::open(path)?;
        let metadata = file.metadata()?;
        let file_size = metadata.len();

        // Detectar rotação ou truncamento do arquivo.
        if file_size < watched.position {
            watched.position = 0;
        }

        // Não ler mais que o limite configurado.
        if file_size > watched.max_size
            && file_size.saturating_sub(watched.position) > watched.max_size
        {
            watched.position = file_size - watched.max_size;
        }

        let mut reader = BufReader::new(file);
        reader.seek(SeekFrom::Start(watched.position))?;

        let mut logs = Vec::new();
        let mut current_position = watched.position;

        for line in reader.lines().take(10000) {
            let line = line?;

            current_position += line.as_bytes().len() as u64 + 1;

            if let Some(log) = Self::analyze_line(patterns, &line) {
                logs.push(log);
            }
        }

        watched.position = current_position;

        Ok(logs)
    }

    fn analyze_line(patterns: &[LogPattern], line: &str) -> Option<SecurityLog> {
        if line.trim().is_empty() {
            return None;
        }

        for pattern in patterns {
            if pattern.pattern.is_match(line) {
                return Some(SecurityLog {
                    event_type: pattern.event_type.clone(),
                    severity: pattern.severity.clone(),
                    message: line.to_string(),
                    source_ip: Self::extract_ip(line),
                    details: Self::extract_details(line),
                    timestamp: Utc::now(),
                });
            }
        }

        if Self::is_likely_log(line) {
            Some(SecurityLog {
                event_type: "SYSTEM_LOG".to_string(),
                severity: Self::guess_severity(line),
                message: line.to_string(),
                source_ip: Self::extract_ip(line),
                details: Self::extract_details(line),
                timestamp: Utc::now(),
            })
        } else {
            None
        }
    }

    fn is_likely_log(line: &str) -> bool {
        let keywords = [
            "log",
            "error",
            "warning",
            "info",
            "debug",
            "trace",
            "fail",
            "success",
            "access",
            "connect",
            "disconnect",
        ];

        let line_lower = line.to_lowercase();

        keywords.iter().any(|keyword| line_lower.contains(keyword))
    }

    fn guess_severity(line: &str) -> LogSeverity {
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

    fn extract_ip(text: &str) -> Option<String> {
        let pattern = Regex::new(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b").ok()?;

        pattern
            .find(text)
            .map(|matched| matched.as_str().to_string())
    }

    fn extract_details(text: &str) -> HashMap<String, serde_json::Value> {
        let mut details = HashMap::new();

        let datetime_pattern = Regex::new(r"\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}").unwrap();

        if let Some(datetime) = datetime_pattern.find(text) {
            details.insert(
                "timestamp".to_string(),
                serde_json::Value::String(datetime.as_str().to_string()),
            );
        }

        let pid_pattern = Regex::new(r"\[(\d+)\]").unwrap();

        if let Some(captures) = pid_pattern.captures(text) {
            if let Some(pid) = captures.get(1) {
                details.insert(
                    "pid".to_string(),
                    serde_json::Value::String(pid.as_str().to_string()),
                );
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
