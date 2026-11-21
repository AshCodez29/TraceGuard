--Duplicate Records
SELECT customerNumber, COUNT(*) AS copies
FROM orders
GROUP BY customerNumber
HAVING COUNT(*) > 1;

--MIssing Values
SELECT *
FROM customers
WHERE customerName IS NULL
   OR TRIM(customerName) = '';

--Invalid USers
SELECT *
FROM orderdetails
WHERE quantityOrdered < 0;

--Inconsistent data
