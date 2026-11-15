# Normalization and design decisions: TraceGuard application database (traceguard_app)

Scope: the 24 tables created by migrations V1 to V6 (plus the three views in V7 and the seed data in V8). Migration V9 (project management) later adds `projects` and `project_assignments`, which makes **26 tables**; those two are documented in `docs/v9_schema_audit_and_er.md`, and the ER diagram shows all 26. This note explains why three representative tables are in Third Normal Form (3NF), and records the design decisions an examiner is likely to ask about.

## Definitions used

- **1NF**: every column holds one atomic value; there are no repeating groups.
- **2NF**: 1NF, and every non-key attribute depends on the *whole* key (matters when a key has several columns).
- **3NF**: 2NF, and no non-key attribute depends on another non-key attribute (no transitive dependency). Equivalently, for every non-trivial functional dependency (FD) X -> A, either X is a superkey or A is part of a candidate key.

Notation: `X -> Y` means "the value of X determines the value of Y".

---

## Part A. Three tables in 3NF

### A1. chain_steps

One row is one hop of a traceability chain, for example "order_details.order_id -> orders.order_id".

| Item | Content |
| --- | --- |
| Primary key | `step_id` |
| Candidate key | `(chain_id, step_order)` (UNIQUE constraint) |
| Foreign key | `chain_id` -> `traceability_chains` |
| Non-key attributes | `kind`, `from_table`, `from_column`, `to_table`, `to_column` |

**Functional dependencies**

- `step_id -> chain_id, step_order, kind, from_table, from_column, to_table, to_column`
- `(chain_id, step_order) -> step_id, kind, from_table, from_column, to_table, to_column`

**1NF.** A chain is stored as *rows*, one per step, never as a comma-separated list in one column. Every column is atomic.

**2NF.** The primary key is one column, so a partial dependency is impossible. For the candidate key `(chain_id, step_order)`, no non-key attribute depends on `chain_id` alone or on `step_order` alone: every chain has a step 1, and `chain_id` alone does not say which hop is meant.

**3NF.** No non-key attribute determines another non-key attribute.
- `kind` (PARENT or CHILD) says how the hop is read. It does not determine any table or column.
- Facts about the chain itself (its name, its rule pack) are stored once in `traceability_chains`. Had `chain_name` been copied into each step, `step_id -> chain_id -> chain_name` would be a transitive dependency.
- `from_table`, `from_column`, `to_table`, `to_column` describe the one link of this step. The schema does not claim that a source column always points to the same target (a column could appear in two chains with different targets), so there is no FD among these four columns that would have to be split out.

**Viva note.** The rule "step k starts at the table where step k-1 ended" relates *different rows*. It is an inter-row integrity rule, not a functional dependency, so it does not affect the normal form. The application checks it when a chain is validated (Step 2B.8).

### A2. issues

One row is one finding that a scan measured on the analyzed database.

| Item | Content |
| --- | --- |
| Primary key | `issue_id` |
| Foreign keys | `scan_id` -> `scans`, `issue_type_id` -> `issue_types` |
| Non-key attributes | `severity`, `table_name`, `column_name`, `related_table`, `related_column`, `affected_rows`, `total_rows`, `status`, `created_at` |

**Functional dependencies**

- `issue_id -> scan_id, issue_type_id, severity, table_name, column_name, related_table, related_column, affected_rows, total_rows, status, created_at`

There is no other candidate key. Two issues in one scan can share type and location (for example two duplicate groups), so no natural key exists and a surrogate key is correct.

**1NF.** All columns are atomic. The sample rows that illustrate an issue are rows in `issue_samples`, not a list inside `issues`.

**2NF.** Single-column key, so no partial dependency.

**3NF.**
- What an issue type *means* (`code`, `description`) lives once in `issue_types`; `issues` holds only the foreign key. Copying the description into `issues` would create `issue_id -> issue_type_id -> description` (transitive).
- Facts about the scan (data source, rule pack, who started it, when) are in `scans` and reached through `scan_id`.
- Explanations (text, model, prompt version) are in `issue_explanations`, because one issue can have several over time. They are a separate entity, not an attribute of the issue.

**Snapshot columns (`total_rows`, `severity`): see Part B.**

### A3. fix_proposals

One row is one suggested repair for one issue.

| Item | Content |
| --- | --- |
| Primary key | `proposal_id` |
| Foreign keys | `issue_id` -> `issues`, `fix_type_id` -> `fix_types`, `approved_by` -> `users` |
| Non-key attributes | `params_json`, `confidence`, `rationale`, `status`, `approved_by`, `approved_at`, `created_at` (Phase 2D migration V11 adds `dry_run_fingerprint` and `dry_run_at`) |

**Functional dependencies**

- `proposal_id -> issue_id, fix_type_id, params_json, confidence, rationale, status, approved_by, approved_at, created_at`

There is no natural candidate key: one issue may have several proposals, even of the same type after a failed attempt.

**1NF.** All columns are atomic. `params_json` is one JSON value, allowed by the JSON rule (see Part C).

**2NF.** Single-column key, so no partial dependency.

**3NF.**
- What a fix type *is* (`code`, `is_destructive`, `is_ddl`, `description`) is stored once in `fix_types`. Copying `is_destructive` into every proposal would create `proposal_id -> fix_type_id -> is_destructive` (transitive).
- Facts about the issue stay in `issues`; facts about the approver (username, role) stay in `users`.
- `approved_by` does not determine `approved_at`: one person approves many proposals at different times.
- `confidence` is not determined by `fix_type_id` alone, because for the recommended type it blends a base value with the model's confidence for this particular issue.
- `status` is not determined by any other non-key column.

**Viva note.** `approved_by` and `approved_at` are both NULL until approval. Which values are allowed in which `status` is a state-machine rule enforced in code (Step 2D.1). It is not a functional dependency, so it does not change the normal form.

---

## Part B. `issues.total_rows` and `issues.severity` are intentional snapshots

A strict reading of 3NF raises two questions about `issues`. Both columns are kept on purpose.

**`total_rows`.** For many issue types it equals the row count of `table_name` recorded in the same scan (`scan_tables.row_count`). If it *always* equalled that value, then `(scan_id, table_name) -> total_rows` would hold, and the column would be redundant (a dependency through non-key columns). It is kept because:
- it is the denominator the detector actually used *when it ran* (for some types, such as chains or fuzzy pairs, it is not simply one table's row count);
- it records a measurement, and a measurement must not change if profile data is later re-computed or corrected.

**`severity`.** It is computed by the severity policy from the affected ratio, the issue type and the rule pack. Because the policy thresholds are tunable (Step 2B.11), the severity that applied *when the scan ran* must be stored. Recomputing it later could give a different answer and would silently rewrite history.

**General principle.** A scan is a historical record. Rows in `issues` are measurements taken at one moment and are not meant to be recomputed. Only `status` is expected to change afterwards (OPEN, RESOLVED, IGNORED). A re-scan creates new rows rather than updating old ones. This is a deliberate, documented departure from the strictest form of 3NF, not an oversight, and the ratio can still be derived from the two stored numbers.

---

## Part C. JSON columns: decisions and a roadmap inconsistency

Design rule (Step 1B.1): JSON is allowed only for data whose shape belongs to someone else, namely sample rows copied from the analyzed database, fix parameters, and row before-images.

| Column | What it holds | Why JSON is justified |
| --- | --- | --- |
| `issue_samples.sample_json` | One sample row copied from the analyzed database | Its columns are those of the *target* table, which differ for every table and every data source |
| `fix_proposals.params_json` | Parameters of a fix (fill value, placeholder key, and so on) | The shape differs per fix type and is defined by the fix handler |
| `fix_snapshots.before_image` | Full copy of a target row before a change | Same reason as `sample_json`: the shape is that of the target table |
| `fix_snapshots.pk_json` | Identity of the affected target row | See below |

**Roadmap inconsistency (recorded decision).** Step 1B.1 lists three permitted uses of JSON, but migration V5 defines a fourth JSON column, `fix_snapshots.pk_json`. The roadmap text and the schema therefore disagree. Decision: **retain `pk_json`** and treat the rule as covering four columns. The roadmap sentence should be read as "sample rows, fix parameters, and the row identity and before-image of target rows".

**Why `pk_json` is retained.** It stores the identity of the affected row so that restore and undo can find exactly that row again (Step 2D.2, "row identity"). The reasons for JSON:
- The row lives in the *analyzed* database, not in `traceguard_app`, so a foreign key to it is impossible.
- Its shape belongs to the target table: a single integer key (`orders`), a character key (`customers`), a composite key (`order_details`, in the clean schema), or, for tables with no primary key such as the broken `order_details`, *all columns compared null-safely*.
- A normalized alternative (one row per key column in a separate table) would need a generic name/value table that mixes types, which is no cleaner than one JSON value.
- It is treated as one opaque value: it is read whole, compared whole, and never queried by its parts, so 1NF is not violated in practice.

**Later phases.** Migration V11 (Step 2D.1 in the roadmap, renumbered because V9 is now the project migration) adds `fix_executions.details_json` for dry-run previews and verification numbers. This is a fifth JSON column, again holding data whose shape varies by fix type. When V11 is written, add it to this table.

---

## Part D. Known limitation: tie in `v_issue_overview`

`v_issue_overview` picks the latest explanation and the latest fix status with `ORDER BY created_at DESC LIMIT 1`. `created_at` is a TIMESTAMP with one-second resolution. If two explanations (or two proposals) for the same issue are created within the same second, they tie and MySQL may return either one, so the view can show the older of the two.

The view is kept exactly as the roadmap defines it. Possible later fixes, not applied in Phase 1B: add the primary key as a second sort key (`ORDER BY created_at DESC, explanation_id DESC`), or use fractional-second timestamps. In practice ties are unlikely, because an explanation and its proposals are produced in separate steps, but regenerating an explanation twice quickly can trigger one.

---

## Part E. Later-phase additions (not part of the current 26 tables)

Migration numbering after V9 became the project-management migration (the roadmap originally planned V9 to V11 for the items below):

| Migration | Content | Roadmap step | Roadmap name |
| --- | --- | --- | --- |
| V9 (written, not yet applied) | `projects`, `project_assignments`, `project_id` on `data_sources` and `scans`, view `v_scan_result` | n/a | n/a |
| V10 | **`scan_chain_results`**, which becomes the **27th table** | Step 2B.8 | V9__chain_results.sql |
| V11 | `dry_run_fingerprint` and `dry_run_at` on `fix_proposals`, `details_json` on `fix_executions` | Step 2D.1 | V10__fix_workflow_columns.sql |
| V12 | `TRACEGUARD_NO_AI` added to `eval_runs.method` | Step 4.1 | V11 |

`scan_chain_results` stores, for each scan and chain, how many rows reach each step and how many break there. The ER diagram `docs/er_traceguard_app.png` shows the 26 tables and 33 foreign keys that exist after V9 and should be regenerated after V10.

---

## Summary

| Table | Key | Transitive dependencies removed by | Result |
| --- | --- | --- | --- |
| chain_steps | `step_id` (candidate: `chain_id, step_order`) | chain facts moved to `traceability_chains` | 3NF |
| issues | `issue_id` | type facts in `issue_types`, scan facts in `scans` | 3NF, with two documented snapshot columns (Part B) |
| fix_proposals | `proposal_id` | fix type facts in `fix_types`, user facts in `users` | 3NF |

| Decision | Outcome |
| --- | --- |
| `fix_snapshots.pk_json` vs the three-use JSON rule | Retained; rule updated to cover it (Part C) |
| `issues.total_rows` and `issues.severity` | Kept as snapshots (Part B) |
| `v_issue_overview` timestamp tie | Documented, view unchanged (Part D) |
| `scan_chain_results` | Later-phase table (migration V10), not in the current 26 (Part E) |
