import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const expected = ['main.js', 'preload.js', 'renderer/**/*', 'assets/**/*'];
if (JSON.stringify(pkg.build?.files) !== JSON.stringify(expected)) {
  throw new Error('electron-builder files must remain the reviewed positive list.');
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    const info = await lstat(target);
    if (info.isSymbolicLink()) throw new Error(`Release input must not be a symlink: ${path.relative(root, target)}`);
    if (entry.isDirectory()) files.push(...await walk(target));
    else files.push(target);
  }
  return files;
}

const rendererFiles = await walk(path.join(root, 'renderer'));
const assetFiles = await walk(path.join(root, 'assets'));
for (const file of assetFiles) {
  if (path.extname(file).toLowerCase() !== '.png') throw new Error(`Unexpected asset type: ${path.relative(root, file)}`);
}
for (const required of ['main.js', 'preload.js', 'renderer/index.html']) {
  await lstat(path.join(root, required));
}

console.log(`Release input audit passed: ${rendererFiles.length} renderer files and ${assetFiles.length} PNG assets.`);
