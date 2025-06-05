const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı bağlantısı
const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

// Örnek ürünler
const products = [
  {
    name: 'Kıymalı Gözleme',
    price: 45.00,
    type: 'Gözleme'
  },
  {
    name: 'Peynirli Gözleme',
    price: 40.00,
    type: 'Gözleme'
  },
  {
    name: 'Patatesli Gözleme',
    price: 35.00,
    type: 'Gözleme'
  },
  {
    name: 'Kıymalı Mantı',
    price: 50.00,
    type: 'Mantı'
  },
  {
    name: 'Peynirli Mantı',
    price: 45.00,
    type: 'Mantı'
  },
  {
    name: 'Ayran',
    price: 15.00,
    type: 'İçecek'
  },
  {
    name: 'Kola',
    price: 20.00,
    type: 'İçecek'
  },
  {
    name: 'Çay',
    price: 10.00,
    type: 'İçecek'
  },
  {
    name: 'Türk Kahvesi',
    price: 25.00,
    type: 'İçecek'
  },
  {
    name: 'Su',
    price: 5.00,
    type: 'İçecek'
  }
];

// Ürünleri ekle
function addProducts() {
  const stmt = db.prepare('INSERT INTO products (name, price, type) VALUES (?, ?, ?)');
  
  products.forEach(product => {
    stmt.run(product.name, product.price, product.type, (err) => {
      if (err) {
        console.error(`Ürün eklenirken hata oluştu: ${product.name}`, err);
      } else {
        console.log(`Ürün eklendi: ${product.name}`);
      }
    });
  });

  stmt.finalize();
}

// Veritabanı bağlantısını kapat
function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('Veritabanı kapatılırken hata oluştu:', err);
    } else {
      console.log('Veritabanı bağlantısı kapatıldı');
    }
  });
}

// Scripti çalıştır
addProducts();
setTimeout(closeDatabase, 1000); // 1 saniye sonra veritabanı bağlantısını kapat 