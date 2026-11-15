-- V9: project management layer
--
-- Adds two tables (projects, project_assignments), links data_sources and scans to
-- projects, and exposes the SCAN_RESULT shape as a view.
-- V1-V8 are not touched. Nothing is dropped or renamed. Every existing row keeps
-- project_id = NULL until a human associates it with a project (no backfill here).

-- ---------------------------------------------------------------------------
-- 1. projects: a project is owned by one user; names are unique per owner only.
-- ---------------------------------------------------------------------------
CREATE TABLE projects (
  project_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  owner_id BIGINT NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  status ENUM('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_project_owner_name (owner_id, name),
  CONSTRAINT fk_project_owner FOREIGN KEY (owner_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 2. project_assignments: many-to-many between projects and users.
--    Role-dependent rules (an AUDITOR may only be READ_ONLY) live in the backend.
-- ---------------------------------------------------------------------------
CREATE TABLE project_assignments (
  project_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  access_level ENUM('CONTRIBUTOR','READ_ONLY') NOT NULL DEFAULT 'READ_ONLY',
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id),
  KEY idx_pa_user (user_id, project_id),
  CONSTRAINT fk_pa_project FOREIGN KEY (project_id) REFERENCES projects(project_id)
    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_pa_user FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- 3. data_sources (the DB_CONNECTION entity): optional link to a project.
--    One project can own many connections. Existing rows stay NULL.
--    uq_ds_source_project makes (source_id, project_id) a referenceable pair for
--    the composite foreign key on scans below.
-- ---------------------------------------------------------------------------
ALTER TABLE data_sources
  ADD COLUMN project_id BIGINT NULL,
  ADD UNIQUE KEY uq_ds_source_project (source_id, project_id),
  ADD KEY idx_ds_project (project_id),
  ADD CONSTRAINT fk_ds_project FOREIGN KEY (project_id) REFERENCES projects(project_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ---------------------------------------------------------------------------
-- 4. scans: record the project the scan ran under.
--    The composite foreign key (source_id, project_id) -> data_sources(source_id, project_id)
--    guarantees at database level that a scan's project is the project of its connection.
--    MySQL skips the check when project_id is NULL, so legacy scans stay valid.
--    ON UPDATE RESTRICT also blocks moving a connection to another project while
--    scans that recorded the old project still reference it (protects history).
--    The existing fk_scan_source (source_id -> data_sources.source_id) is kept.
-- ---------------------------------------------------------------------------
ALTER TABLE scans
  ADD COLUMN project_id BIGINT NULL,
  ADD KEY idx_scans_project (project_id, started_at),
  ADD KEY idx_scans_source_project (source_id, project_id),
  ADD CONSTRAINT fk_scan_source_project FOREIGN KEY (source_id, project_id)
    REFERENCES data_sources(source_id, project_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ---------------------------------------------------------------------------
-- 5. SCAN_RESULT as a view: derived from scans and scan_tables, no duplicated data.
--    (one result per scan, so the scan id is the result id).
--    CAST makes records_checked a BIGINT (SUM over BIGINT would otherwise be DECIMAL(41,0)).
--    While a scan is QUEUED or RUNNING: tables_scanned counts the tables profiled so far,
--    issues_found is still 0 (it is written when the scan finishes) and generated_at is NULL.
-- ---------------------------------------------------------------------------
CREATE VIEW v_scan_result AS
SELECT s.scan_id, s.project_id, s.source_id,
       COUNT(st.scan_table_id) AS tables_scanned,
       CAST(COALESCE(SUM(st.row_count), 0) AS SIGNED) AS records_checked,
       s.issues_found,
       s.status AS scan_status,
       s.finished_at AS generated_at
FROM scans s
LEFT JOIN scan_tables st ON st.scan_id = s.scan_id
GROUP BY s.scan_id, s.project_id, s.source_id, s.issues_found, s.status, s.finished_at;
