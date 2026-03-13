import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = '/vercel/share/v0-project';
const lockFilePath = path.join(projectRoot, 'package-lock.json');

console.log('[v0] Starting dependency fix...');

// Remove package-lock.json if it exists
if (fs.existsSync(lockFilePath)) {
  console.log('[v0] Removing old package-lock.json');
  fs.unlinkSync(lockFilePath);
}

console.log('[v0] Running npm install with legacy peer deps...');
try {
  execSync('npm install --legacy-peer-deps', {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  console.log('[v0] Dependencies successfully installed');
} catch (error) {
  console.error('[v0] Error installing dependencies:', error.message);
  process.exit(1);
}
