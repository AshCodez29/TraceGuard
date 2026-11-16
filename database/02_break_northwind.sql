-- 02_break_northwind.sql
-- Plants known defects into northwind_broken.
-- RUN ONLY ONCE, on a fresh copy of northwind_clean.
-- If you need to run it again, restore northwind_broken from northwind_clean_dump.sql first.

USE northwind_broken;

-- A. Remove every declared constraint (this creates D14: undeclared relationships)
ALTER TABLE employees     DROP FOREIGN KEY fk_employees_manager;
ALTER TABLE products      DROP FOREIGN KEY fk_products_supplier, DROP FOREIGN KEY fk_products_category;
ALTER TABLE orders        DROP FOREIGN KEY fk_orders_customer, DROP FOREIGN KEY fk_orders_employee, DROP FOREIGN KEY fk_orders_shipper;
ALTER TABLE order_details DROP FOREIGN KEY fk_details_order, DROP FOREIGN KEY fk_details_product;
ALTER TABLE order_details DROP PRIMARY KEY;
CREATE INDEX idx_od_order ON order_details(order_id);
ALTER TABLE order_details MODIFY quantity SMALLINT NULL;

-- B. Duplicates
-- D09: 5 exact duplicate customers (new id, same content)
INSERT INTO customers (customer_id, company_name, contact_name, city, country, phone)
SELECT CONCAT('DUP', rn), company_name, contact_name, city, country, phone
FROM (SELECT c.*, ROW_NUMBER() OVER (ORDER BY customer_id) rn FROM customers c) t WHERE rn <= 5;

-- D10: 4 fuzzy duplicate customers (name gets an Inc. suffix)
INSERT INTO customers (customer_id, company_name, contact_name, city, country, phone)
SELECT CONCAT('FZY', rn), CONCAT(company_name, ' Inc.'), contact_name, city, country, phone
FROM (SELECT c.*, ROW_NUMBER() OVER (ORDER BY customer_id DESC) rn
      FROM customers c WHERE customer_id NOT LIKE 'DUP%') t WHERE rn <= 4;

-- D11: copy the first six order business records; the clean dump's next IDs are 831-836.
-- These header-only orders also contribute six records to D15 because no order lines are copied.
INSERT INTO orders (customer_id, employee_id, order_date, required_date, shipped_date, ship_via, freight, ship_country)
SELECT customer_id, employee_id, order_date, required_date, shipped_date, ship_via, freight, ship_country
FROM orders WHERE order_id <= 6;

-- D12: 3 planted duplicate order lines. D01 also creates 3 duplicate business-key groups
-- on orders 1, 3, and 5, so the final database has 6 duplicate keys (16 affected rows).
INSERT INTO order_details
SELECT * FROM order_details WHERE order_id >= 400 ORDER BY order_id, product_id LIMIT 3;

-- C. Orphans
UPDATE order_details SET product_id = 9999 ORDER BY order_id, product_id LIMIT 12;      -- D01
UPDATE orders SET customer_id = 'ZZZZZ' WHERE order_id BETWEEN 700 AND 707;             -- D02
UPDATE orders SET employee_id = 99 WHERE order_id BETWEEN 100 AND 104;                  -- D03
UPDATE products SET supplier_id = 500 ORDER BY product_id LIMIT 6;                      -- D04
UPDATE orders SET ship_via = 7 WHERE order_id BETWEEN 200 AND 203;                      -- D05

-- D. Nulls
UPDATE orders SET customer_id = NULL WHERE order_id BETWEEN 300 AND 309;                -- D06
UPDATE products SET category_id = NULL WHERE product_id BETWEEN 20 AND 26;              -- D07
UPDATE order_details SET quantity = NULL ORDER BY order_id DESC, product_id LIMIT 9;    -- D08

-- E. Circular management chain: 4 -> 5 -> 6 -> 4
UPDATE employees SET reports_to = 5 WHERE employee_id = 4;                              -- D13
UPDATE employees SET reports_to = 6 WHERE employee_id = 5;
UPDATE employees SET reports_to = 4 WHERE employee_id = 6;

-- F. Dead-end chains: orders with no lines
DELETE FROM order_details WHERE order_id BETWEEN 500 AND 504;                           -- D15
