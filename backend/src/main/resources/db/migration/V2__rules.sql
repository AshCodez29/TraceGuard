-- V2: rule packs, traceability chains and their steps, column rules

CREATE TABLE rule_packs (
  rule_pack_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(255),
  version INT NOT NULL DEFAULT 1,
  active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE traceability_chains (
  chain_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  rule_pack_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  UNIQUE (rule_pack_id, name),
  CONSTRAINT fk_chain_pack FOREIGN KEY (rule_pack_id) REFERENCES rule_packs(rule_pack_id)
) ENGINE=InnoDB;

CREATE TABLE chain_steps (
  step_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  chain_id BIGINT NOT NULL,
  step_order TINYINT NOT NULL,
  kind ENUM('PARENT','CHILD') NOT NULL,
  from_table VARCHAR(64) NOT NULL,
  from_column VARCHAR(64) NOT NULL,
  to_table VARCHAR(64) NOT NULL,
  to_column VARCHAR(64) NOT NULL,
  UNIQUE (chain_id, step_order),
  CONSTRAINT fk_step_chain FOREIGN KEY (chain_id) REFERENCES traceability_chains(chain_id)
) ENGINE=InnoDB;

CREATE TABLE pack_column_rules (
  rule_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  rule_pack_id BIGINT NOT NULL,
  table_name VARCHAR(64) NOT NULL,
  column_name VARCHAR(64) NOT NULL,
  rule_type ENUM('REQUIRED','NATURAL_KEY') NOT NULL,
  UNIQUE (rule_pack_id, table_name, column_name, rule_type),
  CONSTRAINT fk_rule_pack FOREIGN KEY (rule_pack_id) REFERENCES rule_packs(rule_pack_id)
) ENGINE=InnoDB;
