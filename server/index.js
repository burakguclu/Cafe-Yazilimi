const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3001;
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

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

app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM orders WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Sipariş silme hatası:', err);
      return res.status(500).json({ error: 'Sipariş silinirken bir hata oluştu' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }
    res.json({ message: 'Sipariş başarıyla silindi' });
  });
});

app.post('/api/orders/save-to-excel', async (req, res) => {
  try {
    const { customerName, date, items, total } = req.body;
    
    // Excel dosyası oluştur
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Siparişler');
    
    // Başlıkları ekle
    worksheet.columns = [
      { header: 'Müşteri', key: 'customerName', width: 20 },
      { header: 'Tarih', key: 'date', width: 20 },
      { header: 'Ürün', key: 'productName', width: 20 },
      { header: 'Adet', key: 'quantity', width: 10 },
      { header: 'Birim Fiyat', key: 'price', width: 15 },
      { header: 'Toplam', key: 'total', width: 15 }
    ];
    
    // Siparişleri ekle
    items.forEach(item => {
      worksheet.addRow({
        customerName,
        date,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      });
    });
    
    // Toplam satırını ekle
    worksheet.addRow({
      customerName: '',
      date: '',
      productName: '',
      quantity: '',
      price: 'TOPLAM',
      total: total
    });
    
    // Excel dosyasını kaydet
    const fileName = `siparis_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, 'excel', fileName);
    
    // Excel klasörünü oluştur
    if (!fs.existsSync(path.join(__dirname, 'excel'))) {
      fs.mkdirSync(path.join(__dirname, 'excel'));
    }
    
    await workbook.xlsx.writeFile(filePath);
    
    res.json({ 
      message: 'Siparişler Excel dosyasına kaydedildi',
      fileName: fileName
    });
  } catch (error) {
    console.error('Excel kaydetme hatası:', error);
    res.status(500).json({ error: 'Excel dosyası oluşturulurken bir hata oluştu' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  
  // Önce bu ürüne ait siparişleri kontrol et
  db.get('SELECT COUNT(*) as count FROM orders WHERE product_id = ?', [id], (err, row) => {
    if (err) {
      console.error('Sipariş kontrolü hatası:', err);
      return res.status(500).json({ error: 'Sipariş kontrolü sırasında bir hata oluştu' });
    }
    
    if (row.count > 0) {
      return res.status(400).json({ 
        error: 'Bu ürüne ait siparişler var. Önce siparişleri silmelisiniz.' 
      });
    }
    
    // Ürünü sil
    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Ürün silme hatası:', err);
        return res.status(500).json({ error: 'Ürün silinirken bir hata oluştu' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Ürün bulunamadı' });
      }
      res.json({ message: 'Ürün başarıyla silindi' });
    });
  });
});

app.post('/api/reset-products', (req, res) => {
  db.serialize(() => {
    // Önce tüm siparişleri sil
    db.run('DELETE FROM orders', (err) => {
      if (err) {
        console.error('Siparişleri silme hatası:', err);
        return res.status(500).json({ error: 'Siparişler silinirken bir hata oluştu' });
      }
      
      // Sonra tüm ürünleri sil
      db.run('DELETE FROM products', (err) => {
        if (err) {
          console.error('Ürünleri silme hatası:', err);
          return res.status(500).json({ error: 'Ürünler silinirken bir hata oluştu' });
        }
        
        // Yeni ürünleri ekle
        const products = [
          { name: 'Kıymalı Gözleme', price: 50, type: 'Gözleme' },
          { name: 'Mantı', price: 45, type: 'Mantı' },
          { name: 'Kola', price: 15, type: 'İçecek' }
        ];
        
        const stmt = db.prepare('INSERT INTO products (name, price, type) VALUES (?, ?, ?)');
        
        products.forEach(product => {
          stmt.run([product.name, product.price, product.type], (err) => {
            if (err) {
              console.error('Ürün ekleme hatası:', err);
            }
          });
        });
        
        stmt.finalize((err) => {
          if (err) {
            console.error('Statement finalize hatası:', err);
            return res.status(500).json({ error: 'Ürünler eklenirken bir hata oluştu' });
          }
          res.json({ message: 'Ürünler başarıyla sıfırlandı' });
        });
      });
    });
  });
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, type } = req.body;

  db.run(
    'UPDATE products SET name = ?, price = ?, type = ? WHERE id = ?',
    [name, price, type, id],
    function(err) {
      if (err) {
        console.error('Ürün güncelleme hatası:', err);
        return res.status(500).json({ error: 'Ürün güncellenirken bir hata oluştu' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Ürün bulunamadı' });
      }
      res.json({ message: 'Ürün başarıyla güncellendi' });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 