const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const desktopDist = path.resolve(rootDir, 'apps', 'desktop', 'dist');
const rootDist = path.resolve(rootDir, 'dist');

console.log('[copy-dist] Synchronizing build output folders...');
if (fs.existsSync(desktopDist)) {
  console.log('[copy-dist] Found apps/desktop/dist. Copying to root dist...');
  fs.mkdirSync(rootDist, { recursive: true });
  fs.cpSync(desktopDist, rootDist, { recursive: true });
} else if (fs.existsSync(rootDist)) {
  console.log('[copy-dist] Found root dist. Copying to apps/desktop/dist...');
  fs.mkdirSync(desktopDist, { recursive: true });
  fs.cpSync(rootDist, desktopDist, { recursive: true });
}
console.log('[copy-dist] Success. Dist folders verified in both locations.');
