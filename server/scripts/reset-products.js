const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı bağlantısı
const db = new sqlite3.Database(path.join(__dirname, '..', 'database.sqlite'), (err) => {
  if (err) {
    console.error('Veritabanına bağlanırken hata:', err.message);
    process.exit(1);
  }
  console.log('Veritabanına bağlandı.');
});

// Ürünleri sıfırla ve yeniden ekle
const resetProducts = () => {
  db.serialize(() => {
    // Önce tüm siparişleri sil
    db.run('DELETE FROM orders', (err) => {
      if (err) {
        console.error('Siparişleri silerken hata:', err.message);
        return;
      }
      console.log('Tüm siparişler silindi.');
    });

    // Sonra tüm ürünleri sil
    db.run('DELETE FROM products', (err) => {
      if (err) {
        console.error('Ürünleri silerken hata:', err.message);
        return;
      }
      console.log('Tüm ürünler silindi.');

      // Products tablosunu yeniden oluştur
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        type TEXT NOT NULL,
        imageUrl TEXT
      )`, (err) => {
        if (err) {
          console.error('Tablo oluşturulurken hata:', err.message);
          return;
        }
        console.log('Products tablosu güncellendi.');

        // Yeni ürünleri ekle
        const products = [
          {
            name: 'Kıymalı Gözleme',
            price: 50,
            type: 'Gözleme',
            imageUrl: '/images/kıymalı-gözleme.jpg'
          },
          {
            name: 'Kıymalı Mantı',
            price: 45,
            type: 'Mantı',
            imageUrl: '/images/kıymalı-mantı.jpg'
          },
          {
            name: 'Kola',
            price: 15,
            type: 'İçecek',
            imageUrl: '/images/kola.jpg'
          }
        ];

        const stmt = db.prepare('INSERT INTO products (name, price, type, imageUrl) VALUES (?, ?, ?, ?)');

        products.forEach(product => {
          stmt.run([product.name, product.price, product.type, product.imageUrl], (err) => {
            if (err) {
              console.error('Ürün eklenirken hata:', err.message);
            } else {
              console.log(`${product.name} eklendi.`);
            }
          });
        });

        stmt.finalize((err) => {
          if (err) {
            console.error('Statement kapatılırken hata:', err.message);
          } else {
            console.log('Tüm ürünler başarıyla eklendi.');
          }
          // Veritabanı bağlantısını kapat
          db.close((err) => {
            if (err) {
              console.error('Veritabanı bağlantısı kapatılırken hata:', err.message);
            } else {
              console.log('Veritabanı bağlantısı kapatıldı.');
            }
          });
        });
      });
    });
  });
};

// Scripti çalıştır
resetProducts(); 