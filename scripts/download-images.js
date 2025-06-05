const fs = require('fs');
const path = require('path');
const https = require('https');

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