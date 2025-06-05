const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('database.sqlite', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  surname TEXT NOT NULL
)`, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Customers table created.');
});

db.run(`CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  type TEXT NOT NULL
)`, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Products table created.');
});

db.run(`CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  total_price REAL NOT NULL,
  order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers (id),
  FOREIGN KEY (product_id) REFERENCES products (id)
)`, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Orders table created.');
});

app.post('/api/customers', (req, res) => {
  const { name, surname } = req.body;
  db.run(`INSERT INTO customers (name, surname) VALUES (?, ?)`, [name, surname], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID });
  });
});

app.post('/api/products', (req, res) => {
  const { name, price, type } = req.body;
  db.run(`INSERT INTO products (name, price, type) VALUES (?, ?, ?)`, [name, price, type], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID });
  });
});

app.get('/api/customers', (req, res) => {
  db.all('SELECT * FROM customers', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/customers/:customerId/orders', (req, res) => {
  const { customerId } = req.params;
  db.all(`
    SELECT o.*, p.name as product_name, p.price, p.type
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE o.customer_id = ?
    ORDER BY o.order_date DESC
  `, [customerId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/orders', (req, res) => {
  const { customer_id, product_id, quantity, total_price } = req.body;
  db.run(
    `INSERT INTO orders (customer_id, product_id, quantity, total_price) 
     VALUES (?, ?, ?, ?)`,
    [customer_id, product_id, quantity, total_price],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 