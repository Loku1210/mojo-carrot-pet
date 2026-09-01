import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = relative => readFileSync(new URL(relative, root), 'utf8');

test('README and status state exact assets and verification limits', () => {
  const docs = `${read('README.md')}\n${read('RELEASE_NOTES.md')}\n${read('RELEASE_STATUS.md')}`;
  for (const expected of [
    'Mojo.Carrot.Pet-1.0.1-arm64.dmg',
    'Mojo.Carrot.Pet.Setup.1.0.1.exe',
    '未签名', '未公证', 'Windows 真机', '结构验证',
    'Apple Silicon', 'Intel', '非官方粉丝作品',
  ]) assert.match(docs, new RegExp(expected.replaceAll('.', '\\.')));
});

test('checksum generation covers every macOS DMG variant the project can build', () => {
  const pkg = JSON.parse(read('package.json'));
  const command = pkg.scripts['dist:checksums'];
  // The universal DMG is a documented release candidate, so SHA256SUMS.txt must cover it.
  assert.equal(/arm64\.dmg/.test(command), false, 'must not hash only the arm64 DMG');
  assert.equal(command.includes(pkg.version), false, 'must not hardcode the version');
  assert.match(command, /Mojo\.Carrot\.Pet-\*\.dmg/);
  assert.match(command, /Mojo\.Carrot\.Pet\.Setup\.\*\.exe/);
  assert.match(command, /SHA256SUMS\.txt/);
});

test('electron-builder emits the same filenames linked by documentation', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.build.mac.artifactName, 'Mojo.Carrot.Pet-${version}-${arch}.${ext}');
  assert.equal(pkg.build.win.artifactName, 'Mojo.Carrot.Pet.Setup.${version}.${ext}');
});
