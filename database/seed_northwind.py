"""
Seed northwind_clean with realistic, reproducible data.

Usage:
    pip3 install mysql-connector-python faker
    export TG_DB_USER=tg_user
    export TG_DB_PASSWORD=change_me
    python3 database/seed_northwind.py

The fixed random seed means everyone running it gets identical data.
Run it only once on an empty northwind_clean database.
"""
import random, datetime, os
import mysql.connector
from faker import Faker

random.seed(42)
Faker.seed(42)
fake = Faker()

cn = mysql.connector.connect(host='localhost', user=os.environ['TG_DB_USER'],
                             password=os.environ['TG_DB_PASSWORD'], database='northwind_clean')
cur = cn.cursor()

# 8 categories
cats = ['Beverages', 'Condiments', 'Confections', 'Dairy Products',
        'Grains/Cereals', 'Meat/Poultry', 'Produce', 'Seafood']
cur.executemany('INSERT INTO categories(category_name, description) VALUES (%s,%s)',
                [(c, c + ' products') for c in cats])

# 3 shippers
cur.executemany('INSERT INTO shippers(company_name, phone) VALUES (%s,%s)',
                [('Speedy Express', '555-0101'), ('United Package', '555-0102'),
                 ('Federal Shipping', '555-0103')])

# 29 suppliers
cur.executemany('INSERT INTO suppliers(company_name, contact_name, city, country, phone) VALUES (%s,%s,%s,%s,%s)',
                [(fake.company()[:80], fake.name(), fake.city(), fake.country()[:60],
                  fake.phone_number()[:30]) for _ in range(29)])

# 9 employees: one VP, eight reps who report to employee 1
sql_emp = 'INSERT INTO employees(last_name, first_name, title, reports_to) VALUES (%s,%s,%s,%s)'
cur.execute(sql_emp, ('Fuller', 'Andrew', 'VP Sales', None))
cur.executemany(sql_emp, [(fake.last_name(), fake.first_name(), 'Sales Rep', 1) for _ in range(8)])

# 91 customers with unique 5-character codes
codes = set()
while len(codes) < 91:
    codes.add(fake.pystr(min_chars=5, max_chars=5).upper())
codes = sorted(codes)
cur.executemany('INSERT INTO customers VALUES (%s,%s,%s,%s,%s,%s)',
                [(c, fake.company()[:80], fake.name(), fake.city(), fake.country()[:60],
                  fake.phone_number()[:30]) for c in codes])

# 77 products
cur.executemany('INSERT INTO products(product_name, supplier_id, category_id, unit_price, units_in_stock, discontinued) VALUES (%s,%s,%s,%s,%s,%s)',
                [(fake.catch_phrase()[:80], random.randint(1, 29), random.randint(1, 8),
                  round(random.uniform(2, 250), 2), random.randint(0, 120),
                  random.choice([0, 0, 0, 0, 1])) for _ in range(77)])
cur.execute('SELECT product_id, unit_price FROM products')
prices = dict(cur.fetchall())

# 830 orders, each with 1 to 5 order lines
start = datetime.date(2024, 1, 1)
for _ in range(830):
    od = start + datetime.timedelta(days=random.randint(0, 729))
    cur.execute('INSERT INTO orders(customer_id, employee_id, order_date, required_date, shipped_date, ship_via, freight, ship_country) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',
                (random.choice(codes), random.randint(1, 9), od, od + datetime.timedelta(days=14),
                 od + datetime.timedelta(days=random.randint(1, 10)), random.randint(1, 3),
                 round(random.uniform(1, 200), 2), fake.country()[:60]))
    oid = cur.lastrowid
    for pid in random.sample(range(1, 78), random.randint(1, 5)):
        cur.execute('INSERT INTO order_details VALUES (%s,%s,%s,%s,%s)',
                    (oid, pid, prices[pid], random.randint(1, 40),
                     random.choice([0, 0, 0, 0.05, 0.1, 0.15, 0.2])))

cn.commit()
cur.close()
cn.close()
print('done')
