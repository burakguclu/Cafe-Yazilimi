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

// Backup klasörü oluşturma
const backupDir = path.join(__dirname, '..', 'backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Günlük log dosyası oluşturma fonksiyonu
function getDailyLogFile() {
  const today = new Date();
  const fileName = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}.txt`;
  const filePath = path.join(backupDir, fileName);
  
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `=== ${today.toLocaleDateString('tr-TR')} Günlük İşlem Kaydı ===\n\n`);
  }
  
  return filePath;
}

// Log yazma fonksiyonu
function writeLog(message) {
  const logFile = getDailyLogFile();
  const timestamp = new Date().toLocaleString('tr-TR');
  fs.appendFileSync(logFile, `${timestamp} - ${message}\n`);
}

// Müşteri klasörü oluşturma fonksiyonu
function getCustomerDir(customerName) {
  const customerDir = path.join(backupDir, customerName);
  if (!fs.existsSync(customerDir)) {
    fs.mkdirSync(customerDir);
  }
  return customerDir;
}

// Excel dosyası oluşturma fonksiyonu
async function createExcelFile(customerName, orderData) {
  const timestamp = new Date();
  const safeName = customerName.replace(/ /g, '-');
  const dateStr = `${String(timestamp.getDate()).padStart(2, '0')}${String(timestamp.getMonth() + 1).padStart(2, '0')}${timestamp.getFullYear()}-${String(timestamp.getHours()).padStart(2, '0')}${String(timestamp.getMinutes()).padStart(2, '0')}${String(timestamp.getSeconds()).padStart(2, '0')}`;
  const fileName = `${safeName}-${dateStr}.xlsx`;
  const filePath = path.join(backupDir, fileName);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sipariş Detayı');

  // Başlık satırı
  worksheet.mergeCells('A1:E1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `${customerName} - ${timestamp.toLocaleString('tr-TR')} Sipariş Detayı`;
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center' };

  // Sütun başlıkları
  worksheet.columns = [
    { header: 'Ürün', key: 'productName', width: 20 },
    { header: 'Tür', key: 'type', width: 15 },
    { header: 'Adet', key: 'quantity', width: 10 },
    { header: 'Toplam Fiyat', key: 'total', width: 15 },
    { header: 'Tarih', key: 'date', width: 20 }
  ];

  // Başlık satırı formatı
  worksheet.getRow(2).font = { bold: true };
  worksheet.getRow(2).alignment = { horizontal: 'center' };

  // Sipariş detayları
  orderData.items.forEach(item => {
    worksheet.addRow({
      productName: item.productName,
      type: item.type, // Ürün türü
      quantity: item.quantity,
      total: item.total,
      date: timestamp.toLocaleString('tr-TR') // Tarih
    });
  });

  // Toplam satırı
  worksheet.addRow({});
  const totalRow = worksheet.addRow({
    productName: 'TOPLAM',
    total: orderData.total
  });
  totalRow.font = { bold: true };
  totalRow.getCell('total').numFmt = '#,##0.00 TL';

  // Tüm sayısal hücrelerin formatı
  worksheet.getColumn('total').numFmt = '#,##0.00 TL';

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

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

app.post('/api/orders', async (req, res) => {
  const { customer_id, product_id, quantity, total_price } = req.body;
  
  try {
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO orders (customer_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)',
        [customer_id, product_id, quantity, total_price],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Müşteri ve ürün bilgilerini al
    const [customer, product] = await Promise.all([
      new Promise((resolve, reject) => {
        db.get('SELECT name FROM customers WHERE id = ?', [customer_id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      }),
      new Promise((resolve, reject) => {
        db.get('SELECT name FROM products WHERE id = ?', [product_id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      })
    ]);

    // Log yaz
    const logMessage = `${customer.name} müşterisi ${product.name} ürününden ${quantity} adet sipariş verdi. Toplam: ${total_price} TL`;
    writeLog(logMessage);
    console.log('Log Mesajı:', logMessage);

    res.json({ id: result });
  } catch (error) {
    console.error('Sipariş ekleme hatası:', error);
    res.status(500).json({ error: 'Sipariş eklenirken bir hata oluştu' });
  }
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
    // Yeni fonksiyonu kullanarak dosyayı oluştur
    const excelPath = await createExcelFile(customerName, { items, total });
    res.json({ 
      message: 'Siparişler Excel dosyasına kaydedildi',
      fileName: excelPath
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

app.post('/api/payment', async (req, res) => {
  const { customerName, date, items, total } = req.body;

  try {
    // Excel dosyası oluştur
    const excelPath = await createExcelFile(customerName, { items, total });
    
    // Log yaz
    const logMessage = `${customerName} müşterisi ${total} TL tutarında ödeme yaptı. ` +
                      `Siparişler: ${items.map(item => `${item.productName} (${item.quantity} adet)`).join(', ')}. ` +
                      `Excel dosyası: ${path.basename(excelPath)}`;
    writeLog(logMessage);
    console.log('Log Mesajı:', logMessage);

    res.json({ success: true, excelPath });
  } catch (error) {
    console.error('Ödeme işlemi hatası:', error);
    res.status(500).json({ error: 'Ödeme işlemi sırasında bir hata oluştu' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 