-- V7: read-only views used by the dashboard (aggregation stays in SQL)

CREATE VIEW v_scan_summary AS
SELECT i.scan_id, it.code AS issue_type, i.severity,
       COUNT(*) AS issue_count, SUM(i.affected_rows) AS rows_affected
FROM issues i JOIN issue_types it ON it.issue_type_id = i.issue_type_id
GROUP BY i.scan_id, it.code, i.severity;

CREATE VIEW v_issue_overview AS
SELECT i.issue_id, i.scan_id, it.code AS issue_type, i.severity, i.table_name, i.column_name,
       i.affected_rows, i.total_rows, i.status,
       (SELECT e.explanation_text FROM issue_explanations e
         WHERE e.issue_id = i.issue_id ORDER BY e.created_at DESC LIMIT 1) AS latest_explanation,
       (SELECT p.status FROM fix_proposals p
         WHERE p.issue_id = i.issue_id ORDER BY p.created_at DESC LIMIT 1) AS latest_fix_status
FROM issues i JOIN issue_types it ON it.issue_type_id = i.issue_type_id;

CREATE VIEW v_fix_audit AS
SELECT x.execution_id, x.mode, x.status, x.rows_affected, x.started_at, u.username,
       ft.code AS fix_type, p.proposal_id, p.issue_id
FROM fix_executions x
JOIN fix_proposals p ON p.proposal_id = x.proposal_id
JOIN fix_types ft ON ft.fix_type_id = p.fix_type_id
JOIN users u ON u.user_id = x.executed_by;
