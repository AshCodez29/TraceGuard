-- V8: lookup data and the northwind-ecommerce rule pack.
-- No admin user here: its password must be BCrypt-hashed, so the backend creates it on first start (Phase 2A).
-- ground_truth.csv is NOT loaded here; that happens in Step 4.1.

INSERT INTO roles(name) VALUES ('ADMIN'), ('DEVELOPER'), ('AUDITOR');

INSERT INTO issue_types(code, description) VALUES
 ('ORPHAN_RECORD',       'Child row references a parent row that does not exist'),
 ('MISSING_FK',          'Relationship exists in the data but no foreign key is declared'),
 ('NULL_VALUE',          'Null in a column that should be filled'),
 ('DUPLICATE_EXACT',     'Rows identical on their natural key'),
 ('DUPLICATE_FUZZY',     'Rows that are probably the same real-world entity'),
 ('CIRCULAR_DEPENDENCY', 'Rows or tables that depend on themselves through a cycle'),
 ('BROKEN_TRACE_CHAIN',  'A traceability chain cannot be followed end to end');

INSERT INTO fix_types(code, is_destructive, is_ddl, description) VALUES
 ('DELETE_ORPHAN_ROWS',      1, 0, 'Delete child rows whose parent is missing'),
 ('SET_NULL_FK',             0, 0, 'Set the dangling foreign key value to NULL'),
 ('REASSIGN_TO_PLACEHOLDER', 0, 0, 'Point orphans at an Unknown placeholder parent row'),
 ('ADD_FOREIGN_KEY',         0, 1, 'Declare the missing foreign key constraint'),
 ('FILL_DEFAULT_VALUE',      0, 0, 'Fill nulls with a chosen or predicted value'),
 ('MERGE_DUPLICATES',        1, 0, 'Keep one row, repoint children, delete the others'),
 ('BREAK_CYCLE',             0, 0, 'Set one link in a cycle to NULL'),
 ('FLAG_ONLY',               0, 0, 'No automatic change, needs a human decision');

INSERT INTO rule_packs(name, description) VALUES ('northwind-ecommerce', 'Customer, order, product chains for Northwind');
SET @pack = LAST_INSERT_ID();

INSERT INTO traceability_chains(rule_pack_id, name) VALUES (@pack, 'Order line to customer');
SET @c1 = LAST_INSERT_ID();
INSERT INTO chain_steps(chain_id, step_order, kind, from_table, from_column, to_table, to_column) VALUES
 (@c1, 1, 'PARENT', 'order_details', 'order_id',    'orders',    'order_id'),
 (@c1, 2, 'PARENT', 'orders',        'customer_id', 'customers', 'customer_id');

INSERT INTO traceability_chains(rule_pack_id, name) VALUES (@pack, 'Order line to product category');
SET @c2 = LAST_INSERT_ID();
INSERT INTO chain_steps(chain_id, step_order, kind, from_table, from_column, to_table, to_column) VALUES
 (@c2, 1, 'PARENT', 'order_details', 'product_id',  'products',   'product_id'),
 (@c2, 2, 'PARENT', 'products',      'category_id', 'categories', 'category_id');

INSERT INTO traceability_chains(rule_pack_id, name) VALUES (@pack, 'Order line to product supplier');
SET @c3 = LAST_INSERT_ID();
INSERT INTO chain_steps(chain_id, step_order, kind, from_table, from_column, to_table, to_column) VALUES
 (@c3, 1, 'PARENT', 'order_details', 'product_id',  'products',  'product_id'),
 (@c3, 2, 'PARENT', 'products',      'supplier_id', 'suppliers', 'supplier_id');

INSERT INTO traceability_chains(rule_pack_id, name) VALUES (@pack, 'Order to employee');
SET @c4 = LAST_INSERT_ID();
INSERT INTO chain_steps(chain_id, step_order, kind, from_table, from_column, to_table, to_column) VALUES
 (@c4, 1, 'PARENT', 'orders', 'employee_id', 'employees', 'employee_id');

INSERT INTO traceability_chains(rule_pack_id, name) VALUES (@pack, 'Order to shipper');
SET @c5 = LAST_INSERT_ID();
INSERT INTO chain_steps(chain_id, step_order, kind, from_table, from_column, to_table, to_column) VALUES
 (@c5, 1, 'PARENT', 'orders', 'ship_via', 'shippers', 'shipper_id');

INSERT INTO traceability_chains(rule_pack_id, name) VALUES (@pack, 'Order must have lines');
SET @c6 = LAST_INSERT_ID();
INSERT INTO chain_steps(chain_id, step_order, kind, from_table, from_column, to_table, to_column) VALUES
 (@c6, 1, 'CHILD', 'orders', 'order_id', 'order_details', 'order_id');

INSERT INTO pack_column_rules(rule_pack_id, table_name, column_name, rule_type) VALUES
 (@pack, 'orders',        'customer_id', 'REQUIRED'),
 (@pack, 'orders',        'employee_id', 'REQUIRED'),
 (@pack, 'products',      'category_id', 'REQUIRED'),
 (@pack, 'products',      'supplier_id', 'REQUIRED'),
 (@pack, 'order_details', 'quantity',    'REQUIRED'),
 (@pack, 'customers', 'company_name', 'NATURAL_KEY'),
 (@pack, 'customers', 'contact_name', 'NATURAL_KEY'),
 (@pack, 'customers', 'city',         'NATURAL_KEY'),
 (@pack, 'customers', 'country',      'NATURAL_KEY'),
 (@pack, 'customers', 'phone',        'NATURAL_KEY'),
 (@pack, 'orders', 'customer_id', 'NATURAL_KEY'),
 (@pack, 'orders', 'employee_id', 'NATURAL_KEY'),
 (@pack, 'orders', 'order_date',  'NATURAL_KEY'),
 (@pack, 'orders', 'freight',     'NATURAL_KEY'),
 (@pack, 'orders', 'ship_via',    'NATURAL_KEY'),
 (@pack, 'order_details', 'order_id',   'NATURAL_KEY'),
 (@pack, 'order_details', 'product_id', 'NATURAL_KEY');
