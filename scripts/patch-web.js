const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');

// Inject PWA tags into index.html
let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('apple-touch-icon')) {
  const tags = [
    '  <link rel="apple-touch-icon" href="/icon.png" />',
    '  <link rel="manifest" href="/manifest.json" />',
    '  <meta name="apple-mobile-web-app-capable" content="yes" />',
    '  <meta name="apple-mobile-web-app-status-bar-style" content="default" />',
    '  <meta name="apple-mobile-web-app-title" content="Numbers" />',
  ].join('\n');
  html = html.replace('</head>', tags + '\n</head>');
  fs.writeFileSync(indexPath, html);
  console.log('PWA tags added to dist/index.html');
}

// Copy icon.png and manifest.json from public/ to dist/
const publicDir = path.join(__dirname, '../public');
['icon.png', 'manifest.json'].forEach(file => {
  const src = path.join(publicDir, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to dist/`);
  }
});
