-- V5: fix lookup, proposals, executions, snapshots, audit log, reports

CREATE TABLE fix_types (
  fix_type_id TINYINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  is_destructive TINYINT(1) NOT NULL,
  is_ddl TINYINT(1) NOT NULL,
  description VARCHAR(200) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE fix_proposals (
  proposal_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  issue_id BIGINT NOT NULL,
  fix_type_id TINYINT NOT NULL,
  params_json JSON NULL,
  confidence DECIMAL(4,3) NOT NULL,
  rationale VARCHAR(500),
  status ENUM('PROPOSED','APPROVED','REJECTED','DRY_RUN_OK','APPLIED','FAILED','UNDONE') NOT NULL DEFAULT 'PROPOSED',
  approved_by BIGINT NULL,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prop_issue FOREIGN KEY (issue_id) REFERENCES issues(issue_id),
  CONSTRAINT fk_prop_type  FOREIGN KEY (fix_type_id) REFERENCES fix_types(fix_type_id),
  CONSTRAINT fk_prop_user  FOREIGN KEY (approved_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE fix_executions (
  execution_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  proposal_id BIGINT NOT NULL,
  mode ENUM('DRY_RUN','APPLY','UNDO') NOT NULL,
  status ENUM('STARTED','SUCCEEDED','FAILED') NOT NULL,
  rows_affected BIGINT NULL,
  executed_by BIGINT NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL,
  error_message VARCHAR(500),
  CONSTRAINT fk_exec_prop FOREIGN KEY (proposal_id) REFERENCES fix_proposals(proposal_id),
  CONSTRAINT fk_exec_user FOREIGN KEY (executed_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE fix_snapshots (
  snapshot_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  execution_id BIGINT NOT NULL,
  table_name VARCHAR(64) NOT NULL,
  pk_json JSON NOT NULL,
  operation ENUM('UPDATE','DELETE','INSERT') NOT NULL,
  before_image JSON NULL,
  after_hash CHAR(64) NULL,
  CONSTRAINT fk_snap_exec FOREIGN KEY (execution_id) REFERENCES fix_executions(execution_id)
) ENGINE=InnoDB;

CREATE TABLE audit_log (
  audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id BIGINT NULL,
  details VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE reports (
  report_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  scan_id BIGINT NOT NULL,
  generated_by BIGINT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rep_scan FOREIGN KEY (scan_id) REFERENCES scans(scan_id),
  CONSTRAINT fk_rep_user FOREIGN KEY (generated_by) REFERENCES users(user_id)
) ENGINE=InnoDB;
