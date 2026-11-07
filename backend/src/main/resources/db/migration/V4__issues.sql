-- V4: issue lookup, issues, samples and AI explanations

CREATE TABLE issue_types (
  issue_type_id TINYINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  description VARCHAR(200) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE issues (
  issue_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  scan_id BIGINT NOT NULL,
  issue_type_id TINYINT NOT NULL,
  severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  table_name VARCHAR(64) NOT NULL,
  column_name VARCHAR(64) NULL,
  related_table VARCHAR(64) NULL,
  related_column VARCHAR(64) NULL,
  affected_rows BIGINT NOT NULL,
  total_rows BIGINT NOT NULL,
  status ENUM('OPEN','RESOLVED','IGNORED') NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_issue_scan FOREIGN KEY (scan_id) REFERENCES scans(scan_id),
  CONSTRAINT fk_issue_type FOREIGN KEY (issue_type_id) REFERENCES issue_types(issue_type_id)
) ENGINE=InnoDB;
CREATE INDEX idx_issues_scan_type ON issues(scan_id, issue_type_id);

CREATE TABLE issue_samples (
  sample_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  issue_id BIGINT NOT NULL,
  sample_order TINYINT NOT NULL,
  sample_json JSON NOT NULL,
  CONSTRAINT fk_sample_issue FOREIGN KEY (issue_id) REFERENCES issues(issue_id)
) ENGINE=InnoDB;

CREATE TABLE issue_explanations (
  explanation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  issue_id BIGINT NOT NULL,
  explanation_text TEXT NOT NULL,
  business_impact TEXT,
  model_name VARCHAR(60) NOT NULL,
  prompt_version VARCHAR(20) NOT NULL,
  grounded TINYINT(1) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_expl_issue FOREIGN KEY (issue_id) REFERENCES issues(issue_id)
) ENGINE=InnoDB;
