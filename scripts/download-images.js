const fs = require('fs');
const path = require('path');
const https = require('https');

const images = {
  'Kıymalı Gözleme': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=60',
  'Peynirli Gözleme': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=60',
  'Patatesli Gözleme': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=60',
  'Kıymalı Mantı': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&auto=format&fit=crop&q=60',
  'Peynirli Mantı': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&auto=format&fit=crop&q=60',
  'Ayran': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=60',
  'Kola': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=60',
  'Çay': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=60',
  'Türk Kahvesi': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=60',
  'Su': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=60'
};

const downloadImage = (url, filename) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const filePath = path.join(__dirname, '../client/public/images', filename);
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download ${url}`));
      }
    }).on('error', reject);
  });
};

const main = async () => {
  // Create images directory if it doesn't exist
  const imagesDir = path.join(__dirname, '../client/public/images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // Download images
  for (const [product, url] of Object.entries(images)) {
    const filename = `${product.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    try {
      await downloadImage(url, filename);
      console.log(`Downloaded ${filename}`);
    } catch (error) {
      console.error(`Error downloading ${filename}:`, error);
    }
  }
};

main().catch(console.error); 