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

test('bundled reactions are short original pet copy plus two reviewed fandom references', () => {
  const messages = Object.values(config.messages).flat();
  assert.ok(messages.every(message => typeof message === 'string' && message.length > 0 && message.length <= 32));
  assert.equal(messages.filter(message => message === '我们是！五月天！').length, 1);
  assert.equal(messages.filter(message => message === '再戳我要告诉阿信咯').length, 1);
  for (const removed of [
    '幸运 在我手心', '狂飙爱意', '温柔的海涌', '我还是一个我', '最完美的阵容',
    '不知不觉不经意', '予阮一个梦', '心上一字敢', '毋是好囝', '好想好想飞',
    '疯狂世界', '下个路口', '彼粒星', '我有我的路', '云一蕊', '爱眠梦',
    '写新专辑', '敢讲伊是一场空', '再尝一点美梦', '宠上了天',
  ]) assert.equal(messages.some(message => message.includes(removed)), false, removed);
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
