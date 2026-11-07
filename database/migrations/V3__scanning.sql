-- V3: scans and what a scan measures about the target database

CREATE TABLE scans (
  scan_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  source_id BIGINT NOT NULL,
  rule_pack_id BIGINT NOT NULL,
  started_by BIGINT NOT NULL,
  status ENUM('QUEUED','RUNNING','COMPLETED','FAILED') NOT NULL DEFAULT 'QUEUED',
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL,
  issues_found INT NOT NULL DEFAULT 0,
  error_message VARCHAR(500),
  CONSTRAINT fk_scan_source FOREIGN KEY (source_id) REFERENCES data_sources(source_id),
  CONSTRAINT fk_scan_pack   FOREIGN KEY (rule_pack_id) REFERENCES rule_packs(rule_pack_id),
  CONSTRAINT fk_scan_user   FOREIGN KEY (started_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE scan_tables (
  scan_table_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  scan_id BIGINT NOT NULL,
  table_name VARCHAR(64) NOT NULL,
  row_count BIGINT NOT NULL,
  UNIQUE (scan_id, table_name),
  CONSTRAINT fk_st_scan FOREIGN KEY (scan_id) REFERENCES scans(scan_id)
) ENGINE=InnoDB;

CREATE TABLE scan_columns (
  scan_column_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  scan_table_id BIGINT NOT NULL,
  column_name VARCHAR(64) NOT NULL,
  data_type VARCHAR(30) NOT NULL,
  is_nullable TINYINT(1) NOT NULL,
  is_primary_key TINYINT(1) NOT NULL,
  null_count BIGINT NOT NULL DEFAULT 0,
  distinct_count BIGINT NOT NULL DEFAULT 0,
  UNIQUE (scan_table_id, column_name),
  CONSTRAINT fk_sc_table FOREIGN KEY (scan_table_id) REFERENCES scan_tables(scan_table_id)
) ENGINE=InnoDB;

CREATE TABLE scan_relationships (
  rel_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  scan_id BIGINT NOT NULL,
  from_table VARCHAR(64) NOT NULL,
  from_column VARCHAR(64) NOT NULL,
  to_table VARCHAR(64) NOT NULL,
  to_column VARCHAR(64) NOT NULL,
  origin ENUM('DECLARED','INFERRED') NOT NULL,
  confidence DECIMAL(4,3) NULL,
  method VARCHAR(30) NULL,
  reasoning VARCHAR(500) NULL,
  status ENUM('DECLARED','PROPOSED','ACCEPTED','REJECTED') NOT NULL,
  UNIQUE (scan_id, from_table, from_column, to_table, to_column),
  CONSTRAINT fk_rel_scan FOREIGN KEY (scan_id) REFERENCES scans(scan_id)
) ENGINE=InnoDB;
