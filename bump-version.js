import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Replicate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkgPath = join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

let [major, minor, patch] = pkg.version.split('.').map(Number);
patch += 1;
pkg.version = `${major}.${minor}.${patch}`;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`✅ Version bumped to: ${pkg.version}`);
