// Explicit repository-owned migration to stream-json's maintained Node stream API.
// No lifecycle hook, network download, runtime loader interception or global patch.
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
const root = new URL('./node_modules/firebase-tools/', import.meta.url);
const version = JSON.parse(readFileSync(new URL('package.json', root))).version;
if (version !== '15.30.2') throw new Error('Review the Firebase compatibility patch before changing CLI versions.');
const resolveFromCli = createRequire(new URL('package.json', root));
const streamManifest = resolve(dirname(resolveFromCli.resolve('stream-json')), '../package.json');
if (JSON.parse(readFileSync(streamManifest)).version !== '3.6.0') throw new Error('Expected the reviewed stream-json 3.6.0 dependency.');
const patches = [
  ['lib/database/import.js', 'cbf075c20415428f285095e2eec7c35182b1d4f3568b965bcf7727d8bdcf9cee', [
    ['require("stream-json/filters/Filter")', 'require("stream-json/filters/filter.js").filter'],
    ['require("stream-json/streamers/StreamObject")', 'require("stream-json/streamers/stream-object.js")'],
    ['Filter.withParser({', 'Filter.withParserAsStream({'],
    ['StreamObject.streamObject()', 'StreamObject.streamObject.asStream()'],
  ]],
  ['lib/frameworks/next/index.js', 'e02e16d5009cbf16cf177b23b3c509353b2666075245845867e049c8a14a37b3', [
    ['require("stream-json/filters/Pick")', 'require("stream-json/filters/pick.js")'],
    ['require("stream-json/streamers/StreamObject")', 'require("stream-json/streamers/stream-object.js")'],
    ['stream_json_1.parser)', 'stream_json_1.parserStream)'],
    ['Pick_1.pick)', 'Pick_1.pick.asStream)'],
    ['StreamObject_1.streamObject)', 'StreamObject_1.streamObject.asStream)'],
  ]],
];
const digest = value => createHash('sha256').update(value).digest('hex');
// Validate ALL inputs before changing any file. Accept an already-applied patch.
const pending = patches.map(([path, expected, replacements]) => {
  const file = new URL(path, root);
  const current = readFileSync(file, 'utf8');
  let original = current;
  if (digest(current) !== expected) {
    for (const [before, after] of replacements) original = original.replace(after, before);
    if (digest(original) !== expected) throw new Error(`Unrecognized Firebase source: ${path}. Reinstall or review the patch.`);
  }
  let patched = original;
  for (const [before, after] of replacements) {
    if (patched.split(before).length !== 2) throw new Error(`Ambiguous patch: ${path}`);
    patched = patched.replace(before, after);
  }
  if (current !== original && current !== patched) throw new Error(`Partial patch: ${path}. Reinstall first.`);
  return {file, patched};
});
for (const {file, patched} of pending) writeFileSync(file, patched);
console.log('Firebase CLI: verified and applied stream-json 3.6 Node stream migration.');
