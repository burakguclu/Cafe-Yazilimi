import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// SQLite veritabanı bağlantısı
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API çalışıyor!');
});

// Veritabanı bağlantısını test et
sequelize.authenticate()
  .then(() => {
    console.log('Veritabanı bağlantısı başarılı.');
  })
  .catch((err: Error) => {
    console.error('Veritabanı bağlantısı başarısız:', err);
  });

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
}); 