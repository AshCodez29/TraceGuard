USE northwind_clean;

CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(40) NOT NULL,
  description VARCHAR(200)
) ENGINE=InnoDB;

CREATE TABLE suppliers (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(80) NOT NULL,
  contact_name VARCHAR(60),
  city VARCHAR(60),
  country VARCHAR(60),
  phone VARCHAR(30)
) ENGINE=InnoDB;

CREATE TABLE shippers (
  shipper_id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(80) NOT NULL,
  phone VARCHAR(30)
) ENGINE=InnoDB;

CREATE TABLE employees (
  employee_id INT AUTO_INCREMENT PRIMARY KEY,
  last_name VARCHAR(40) NOT NULL,
  first_name VARCHAR(40) NOT NULL,
  title VARCHAR(60),
  reports_to INT NULL,
  CONSTRAINT fk_employees_manager FOREIGN KEY (reports_to) REFERENCES employees(employee_id)
) ENGINE=InnoDB;

CREATE TABLE customers (
  customer_id CHAR(5) PRIMARY KEY,
  company_name VARCHAR(80) NOT NULL,
  contact_name VARCHAR(60),
  city VARCHAR(60),
  country VARCHAR(60),
  phone VARCHAR(30)
) ENGINE=InnoDB;

CREATE TABLE products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(80) NOT NULL,
  supplier_id INT NULL,
  category_id INT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  units_in_stock SMALLINT NOT NULL DEFAULT 0,
  discontinued TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id)
) ENGINE=InnoDB;

CREATE TABLE orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id CHAR(5) NULL,
  employee_id INT NULL,
  order_date DATE NOT NULL,
  required_date DATE,
  shipped_date DATE,
  ship_via INT NULL,
  freight DECIMAL(10,2) NOT NULL DEFAULT 0,
  ship_country VARCHAR(60),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
  CONSTRAINT fk_orders_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
  CONSTRAINT fk_orders_shipper  FOREIGN KEY (ship_via)    REFERENCES shippers(shipper_id)
) ENGINE=InnoDB;

CREATE TABLE order_details (
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity SMALLINT NOT NULL,
  discount DECIMAL(3,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (order_id, product_id),
  CONSTRAINT fk_details_order   FOREIGN KEY (order_id)   REFERENCES orders(order_id),
  CONSTRAINT fk_details_product FOREIGN KEY (product_id) REFERENCES products(product_id)
) ENGINE=InnoDB;
