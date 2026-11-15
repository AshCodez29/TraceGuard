export const DEMO_ORG = 'Northwind Labs';

export const DEMO_PROJECTS = [
  { id: 'p1', name: 'northwind_broken', team: 'Platform', status: 'completed', database: 'MySQL 8.0', owner: 'priya', sharedWith: ['sam'], assignedTo: ['alex.auditor'], active: true },
  { id: 'p2', name: 'billing_legacy', team: 'Billing', status: 'scanned', progress: 64, database: 'MySQL 5.7', owner: 'sam', sharedWith: ['priya'], assignedTo: [], active: true },
  { id: 'p3', name: 'crm_migration', team: 'Platform', status: 'completed', date: 'Jun 12', found: 31, fixed: 31, rows: 1240, database: 'MySQL 8.0', owner: 'priya', sharedWith: [], assignedTo: ['alex.auditor'], active: true },
  { id: 'p4', name: 'inventory_2025', team: 'Data', status: 'completed', date: 'Apr 3', found: 18, fixed: 16, rows: 402, database: 'MySQL 8.0', owner: 'lee', sharedWith: [], assignedTo: [], active: true },
];

export const DEMO_FINDINGS = [
  { id: 1, severity: 'CRITICAL', type: 'Orphan record', location: 'products.supplier_id', affected: '6 of 77', count: 6, fix: 'Reassign to a placeholder supplier', confidence: '0.60', explanation: ['Migration V47__drop_legacy_suppliers deleted 6 supplier rows on Jun 2 at 14:07.', 'No ON DELETE rule existed on products.supplier_id, so nothing cascaded.'], evidence: [['12', '31'], ['40', '31'], ['58', '44']], columns: ['product_id', 'supplier_id'] },
  { id: 2, severity: 'HIGH', type: 'Orphan record', location: 'orders.customer_id', affected: '8 of 836', count: 8, fix: 'Flag for review (no safe automatic fix)', confidence: '0.45', explanation: ['A cleanup job removed 8 inactive customers on May 28.', 'Orders were kept for accounting, so their references now dangle.'], evidence: [['10321', 'C-0417'], ['10388', 'C-0417'], ['10402', 'C-0533']], columns: ['order_id', 'customer_id'] },
  { id: 3, severity: 'HIGH', type: 'Orphan record', location: 'orders.employee_id', affected: '5 of 836', count: 5, fix: 'Set employee_id to NULL', confidence: '0.55', explanation: ['Employee import V52 reloaded employees with new IDs.', 'Five orders still hold the old IDs.'], evidence: [['10110', 'E-19'], ['10144', 'E-19'], ['10190', 'E-23']], columns: ['order_id', 'employee_id'] },
  { id: 4, severity: 'MEDIUM', type: 'Orphan record', location: 'order_details.product_id', affected: '12 of 2,518', count: 12, fix: 'Delete orphan rows', confidence: '0.55', explanation: ['All 12 rows use product_id 9999, pointing to a bulk edit rather than random typos.', 'No matching migration was found, so confidence is lower.'], evidence: [['1', '9999'], ['1', '9999'], ['2', '9999']], columns: ['order_id', 'product_id'] },
  { id: 5, severity: 'MEDIUM', type: 'Proposed link', location: 'orders.ship_via → shippers.shipper_id', affected: '3 of 3 values', count: 0.74, isLink: true, fix: 'Accept as a tracked relationship', confidence: '0.74', explanation: ['Column names differ, but all 3 distinct values exist in shippers.', 'TraceGuard cannot confirm meaning, so a person must decide.'], evidence: [['10001', '1'], ['10002', '3'], ['10003', '2']], columns: ['order_id', 'ship_via'] },
];

export const DEMO_TABLES = {
  customers: { rows: '100 rows', x: 30, y: 20, columns: ['customer_id*', 'company_name', 'contact_name', 'city', 'country', 'phone'] },
  orders: { rows: '836 rows', x: 260, y: 20, columns: ['order_id*', 'customer_id>customers', 'employee_id>employees', 'ship_via>shippers', 'order_date'] },
  shippers: { rows: '3 rows', x: 490, y: 20, columns: ['shipper_id*', 'company_name'] },
  employees: { rows: '9 rows', x: 30, y: 140, columns: ['employee_id*', 'first_name', 'last_name', 'reports_to>employees'] },
  order_details: { rows: '2,518 rows', x: 260, y: 140, columns: ['order_id*', 'product_id*', 'unit_price', 'quantity'] },
  suppliers: { rows: '29 rows', x: 30, y: 260, columns: ['supplier_id*', 'company_name', 'country'] },
  products: { rows: '77 rows', x: 260, y: 260, columns: ['product_id*', 'supplier_id>suppliers', 'category_id>categories', 'product_name'] },
  categories: { rows: '8 rows', x: 490, y: 260, columns: ['category_id*', 'category_name'] },
};

export const DEMO_SECURITY = [
  { severity: 'CRITICAL', title: 'Dynamic SQL detected', location: 'OrderRepository.java:88', code: 'String q = "SELECT * FROM orders WHERE id = " + id;', recommendation: 'Use a PreparedStatement with bound parameters.' },
  { severity: 'CRITICAL', title: 'DELETE without WHERE', location: 'CleanupJob.java:44', code: 'DELETE FROM order_items;', recommendation: 'Add a WHERE clause or a guarded batch condition.' },
  { severity: 'HIGH', title: 'Missing prepared statement', location: 'PaymentDAO.java:112', code: 'stmt.execute(rawQuery);', recommendation: 'Replace Statement with PreparedStatement.' },
  { severity: 'MEDIUM', title: 'Weak constraint', location: 'schema.sql:210', code: 'supplier_id INT NULL', recommendation: 'Add NOT NULL and a foreign key to suppliers.id.' },
];

export const DEMO_HISTORY = [
  { date: 'Today 10:42', projectId: 'p1', scan: 'Scan #14', status: 'Completed', issues: 5 },
  { date: 'Jun 12', projectId: 'p3', scan: 'Report generated', status: 'Completed', issues: 31 },
  { date: 'Jun 12', projectId: 'p3', scan: 'Scan #9', status: 'Completed', issues: 31 },
  { date: 'Apr 3', projectId: 'p4', scan: 'Scan #4', status: 'Completed', issues: 18 },
  { date: 'Mar 28', projectId: 'p2', scan: 'Scan #2', status: 'Failed · connection timeout', issues: 0 },
];

export const DEMO_USERS = [
  { id: 'u1', username: 'priya', email: 'priya@northwind.io', role: 'DEVELOPER', active: true },
  { id: 'u2', username: 'sam', email: 'sam@northwind.io', role: 'DEVELOPER', active: true },
  { id: 'u3', username: 'lee', email: 'lee@northwind.io', role: 'DEVELOPER', active: true },
  { id: 'u4', username: 'alex.auditor', email: 'alex@northwind.io', role: 'AUDITOR', active: true },
  { id: 'u5', username: 'admin', email: 'admin@northwind.io', role: 'ADMIN', active: true },
];

export const DEMO_CONNECTIONS = [
  { id: 'c1', name: 'northwind_broken', engine: 'MySQL 8.0', host: 'localhost:3306', projectId: 'p1', status: 'Sample connection' },
  { id: 'c2', name: 'billing_legacy', engine: 'MySQL 5.7', host: 'db.internal:3306', projectId: 'p2', status: 'Sample connection' },
];

export const DEMO_REPORTS = [
  { id: 'r1', title: 'northwind_broken · Scan #14', date: 'Today 10:42', findings: 5, projectId: 'p1' },
  { id: 'r2', title: 'crm_migration · Scan #9', date: 'Jun 12', findings: 31, projectId: 'p3' },
];
