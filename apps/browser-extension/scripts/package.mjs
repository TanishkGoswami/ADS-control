import AdmZip from 'adm-zip';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const outputDir = resolve(root, '../web/public/downloads');
const output = resolve(outputDir, `ads-control-companion-v${version}.zip`);
mkdirSync(outputDir, { recursive: true });
const zip = new AdmZip();
zip.addLocalFolder(resolve(root, 'dist'));
zip.writeZip(output);
console.log(`Extension package: ${output}`);
