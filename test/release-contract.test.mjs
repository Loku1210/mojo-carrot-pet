import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = relative => readFileSync(new URL(relative, root), 'utf8');
const configContext = { window: {}, console };
vm.runInNewContext(`${read('renderer/config.js')}\n;globalThis.__config = PET_CONFIG;`, configContext);
const config = configContext.__config;

test('every declared animation has exactly its packaged PNG frame count', () => {
  for (const [name, animation] of Object.entries(config.animations)) {
    const directory = new URL(`assets/frames/${animation.folder}/`, root);
    const files = readdirSync(directory).filter(file => file.endsWith('.png')).sort();
    assert.equal(files.length, animation.count, name);
    assert.deepEqual(files, Array.from({ length: animation.count }, (_, index) => `${String(index).padStart(2, '0')}.png`));
  }
});

test('bundled reactions preserve Loku\'s reviewed local dialogue set exactly', () => {
  const expected = JSON.parse(read('test/fixtures/loku-messages.json'));
  const actual = JSON.parse(JSON.stringify(config.messages));
  assert.deepEqual(actual, expected);
});

test('Electron renderer is isolated and cannot create navigation or new windows', () => {
  const main = read('main.js');
  assert.match(main, /contextIsolation:\s*true/);
  assert.match(main, /nodeIntegration:\s*false/);
  assert.match(main, /setWindowOpenHandler/);
  assert.match(main, /will-navigate/);
  assert.match(main, /action:\s*'deny'/);
});

test('release files remain a narrow positive list', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.deepEqual(pkg.build.files, ['main.js', 'preload.js', 'renderer/**/*', 'assets/**/*']);
  assert.equal(pkg.name, 'mojo-carrot-pet');
  assert.equal(pkg.scripts.test, 'node --test test/*.test.mjs');
  assert.equal(pkg.scripts.verify, 'npm test && npm run audit:inputs');
});
