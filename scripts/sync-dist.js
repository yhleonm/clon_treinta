const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const desktopDist = path.resolve(rootDir, 'apps', 'desktop', 'dist');
const rootDist = path.resolve(rootDir, 'dist');
const vercelOutputStatic = path.resolve(rootDir, '.vercel', 'output', 'static');
const vercelOutputConfig = path.resolve(rootDir, '.vercel', 'output', 'config.json');

console.log('[copy-dist] Synchronizing build output folders...');

const source = fs.existsSync(desktopDist) ? desktopDist : (fs.existsSync(rootDist) ? rootDist : null);

if (source) {
  // 1. Root dist
  if (source !== rootDist) {
    fs.mkdirSync(rootDist, { recursive: true });
    fs.cpSync(source, rootDist, { recursive: true });
  }

  // 2. Apps desktop dist
  if (source !== desktopDist) {
    fs.mkdirSync(desktopDist, { recursive: true });
    fs.cpSync(source, desktopDist, { recursive: true });
  }

  // 3. Vercel Build Output API v3
  fs.mkdirSync(vercelOutputStatic, { recursive: true });
  fs.cpSync(source, vercelOutputStatic, { recursive: true });

  // 4. Vercel config.json
  const vercelConfig = {
    version: 3,
    routes: [
      { handle: "filesystem" },
      { src: "/(.*)", dest: "/index.html" }
    ]
  };
  fs.writeFileSync(vercelOutputConfig, JSON.stringify(vercelConfig, null, 2));

  console.log('[copy-dist] Success. Dist folders and .vercel/output verified in all locations.');
} else {
  console.error('[copy-dist] Error: No build output directory found!');
}
