-- V6: evaluation (ground truth is loaded later, in Step 4.1)

CREATE TABLE ground_truth_defects (
  defect_id VARCHAR(5) PRIMARY KEY,
  issue_type_id TINYINT NOT NULL,
  table_name VARCHAR(64) NOT NULL,
  column_name VARCHAR(64) NULL,
  expected_count INT NOT NULL,
  description VARCHAR(200),
  CONSTRAINT fk_gt_type FOREIGN KEY (issue_type_id) REFERENCES issue_types(issue_type_id)
) ENGINE=InnoDB;

CREATE TABLE eval_runs (
  eval_run_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  method ENUM('TRACEGUARD','SQL_ONLY','LLM_ONLY') NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  scan_id BIGINT NULL,
  CONSTRAINT fk_er_scan FOREIGN KEY (scan_id) REFERENCES scans(scan_id)
) ENGINE=InnoDB;

CREATE TABLE eval_results (
  result_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  eval_run_id BIGINT NOT NULL,
  defect_id VARCHAR(5) NOT NULL,
  detected TINYINT(1) NOT NULL,
  detected_count INT NULL,
  CONSTRAINT fk_ev_run FOREIGN KEY (eval_run_id) REFERENCES eval_runs(eval_run_id),
  CONSTRAINT fk_ev_def FOREIGN KEY (defect_id) REFERENCES ground_truth_defects(defect_id)
) ENGINE=InnoDB;
