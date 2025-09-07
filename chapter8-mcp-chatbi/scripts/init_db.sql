# create schema chatbi collate utf8mb4_general_ci;

-- scripts/init_db.sql
CREATE DATABASE IF NOT EXISTS chatbi;
USE chatbi;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS visualizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT,
    title VARCHAR(255) NOT NULL,
    chart_type VARCHAR(50) NOT NULL,
    chart_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Sample data
INSERT INTO users (username, email, password_hash) VALUES
('admin', 'admin@example.com', '$2b$12$1234567890123456789012uQYxg7vLu/GJo/mTq1kJt1UrPmG5GXW'),
('demo', 'demo@example.com', '$2b$12$1234567890123456789012uQYxg7vLu/GJo/mTq1kJt1UrPmG5GXW');

-- Sample tables for BI queries
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    sale_date DATE NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    region VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    supplier VARCHAR(100) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    join_date DATE NOT NULL
);

-- Insert sample data for products
INSERT INTO products (name, category, supplier, cost_price, selling_price) VALUES
('Laptop', 'Electronics', 'TechCorp', 800.00, 1200.00),
('Smartphone', 'Electronics', 'MobileTech', 400.00, 700.00),
('Desk Chair', 'Furniture', 'FurniCo', 120.00, 250.00),
('Coffee Table', 'Furniture', 'WoodWorks', 180.00, 350.00),
('Headphones', 'Electronics', 'AudioTech', 50.00, 120.00),
('Monitor', 'Electronics', 'ScreenTech', 150.00, 300.00),
('Keyboard', 'Electronics', 'InputCo', 30.00, 80.00),
('Mouse', 'Electronics', 'InputCo', 15.00, 40.00),
('Desk', 'Furniture', 'WoodWorks', 200.00, 400.00),
('Bookshelf', 'Furniture', 'FurniCo', 90.00, 180.00);

-- Insert sample data for customers
INSERT INTO customers (name, email, city, country, join_date) VALUES
('John Smith', 'john@example.com', 'New York', 'USA', '2020-01-15'),
('Emma Johnson', 'emma@example.com', 'London', 'UK', '2020-02-20'),
('Michael Brown', 'michael@example.com', 'Toronto', 'Canada', '2020-03-10'),
('Sophia Garcia', 'sophia@example.com', 'Madrid', 'Spain', '2020-04-05'),
('William Lee', 'william@example.com', 'Sydney', 'Australia', '2020-05-12'),
('Olivia Wilson', 'olivia@example.com', 'Chicago', 'USA', '2020-06-18'),
('James Taylor', 'james@example.com', 'Manchester', 'UK', '2020-07-22'),
('Ava Martinez', 'ava@example.com', 'Mexico City', 'Mexico', '2020-08-30'),
('Alexander Wang', 'alexander@example.com', 'Beijing', 'China', '2020-09-14'),
('Isabella Kim', 'isabella@example.com', 'Seoul', 'South Korea', '2020-10-25');

-- Insert sample data for sales
INSERT INTO sales (product_id, customer_id, sale_date, quantity, unit_price, total_amount, region) VALUES
(1, 1, '2023-01-10', 2, 1200.00, 2400.00, 'North America'),
(2, 2, '2023-01-15', 1, 700.00, 700.00, 'Europe'),
(3, 3, '2023-01-20', 3, 250.00, 750.00, 'North America'),
(4, 4, '2023-01-25', 1, 350.00, 350.00, 'Europe'),
(5, 5, '2023-02-05', 2, 120.00, 240.00, 'Asia Pacific'),
(6, 6, '2023-02-10', 1, 300.00, 300.00, 'North America'),
(7, 7, '2023-02-15', 4, 80.00, 320.00, 'Europe'),
(8, 8, '2023-02-20', 2, 40.00, 80.00, 'Latin America'),
(9, 9, '2023-03-01', 1, 400.00, 400.00, 'Asia Pacific'),
(10, 10, '2023-03-05', 2, 180.00, 360.00, 'Asia Pacific'),
(1, 2, '2023-03-10', 1, 1200.00, 1200.00, 'Europe'),
(2, 3, '2023-03-15', 2, 700.00, 1400.00, 'North America'),
(3, 4, '2023-03-20', 1, 250.00, 250.00, 'Europe'),
(4, 5, '2023-03-25', 2, 350.00, 700.00, 'Asia Pacific'),
(5, 6, '2023-04-01', 3, 120.00, 360.00, 'North America'),
(6, 7, '2023-04-05', 1, 300.00, 300.00, 'Europe'),
(7, 8, '2023-04-10', 2, 80.00, 160.00, 'Latin America'),
(8, 9, '2023-04-15', 3, 40.00, 120.00, 'Asia Pacific'),
(9, 10, '2023-04-20', 1, 400.00, 400.00, 'Asia Pacific'),
(10, 1, '2023-04-25', 2, 180.00, 360.00, 'North America'),
(1, 3, '2023-05-01', 1, 1200.00, 1200.00, 'North America'),
(2, 4, '2023-05-05', 1, 700.00, 700.00, 'Europe'),
(3, 5, '2023-05-10', 2, 250.00, 500.00, 'Asia Pacific'),
(4, 6, '2023-05-15', 1, 350.00, 350.00, 'North America'),
(5, 7, '2023-05-20', 2, 120.00, 240.00, 'Europe'),
(6, 8, '2023-05-25', 1, 300.00, 300.00, 'Latin America'),
(7, 9, '2023-06-01', 3, 80.00, 240.00, 'Asia Pacific'),
(8, 10, '2023-06-05', 2, 40.00, 80.00, 'Asia Pacific'),
(9, 1, '2023-06-10', 1, 400.00, 400.00, 'North America'),
(10, 2, '2023-06-15', 2, 180.00, 360.00, 'Europe');