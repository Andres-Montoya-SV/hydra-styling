import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {Readable, Writable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const require = createRequire(new URL('./node_modules/firebase-tools/package.json', import.meta.url));
const {parserStream} = require('stream-json');
const {pick} = require('stream-json/filters/pick.js');
const {filter} = require('stream-json/filters/filter.js');
const {streamObject} = require('stream-json/streamers/stream-object.js');
async function collect(input, ...stages) {
  const values = [];
  await pipeline(Readable.from([input]), ...stages, new Writable({objectMode: true, write(value, _, done) {values.push(value); done();}}));
  return values;
}
test('CLI starts with patched dependency and patch is idempotent', () => {
  execFileSync(process.execPath, [fileURLToPath(new URL('./patch-cli.mjs', import.meta.url))]);
  const cli = new URL('./node_modules/firebase-tools/lib/bin/firebase.js', import.meta.url);
  assert.equal(execFileSync(process.execPath, [fileURLToPath(cli), '--version'], {encoding:'utf8'}).trim(), '15.30.2');
});
test('Next.js npm-ls pipeline retains nested dependency names using legacy stream-chain', async () => {
  const {chain} = require('stream-chain');
  const stages = chain([
    parserStream({packValues:false, packKeys:true, streamValues:false}),
    pick.asStream({filter:'dependencies'}), streamObject.asStream(),
  ]);
  const input = {name:'fixture', dependencies:{react:{version:'19.3.0',dependencies:{scheduler:{version:'1'}}},firebase:{version:'12.19.0'}}};
  const rows = await collect(JSON.stringify(input), stages);
  const {allDependencyNames} = require('./lib/frameworks/next/utils.js');
  assert.deepEqual(rows.flatMap(({key,value})=>[key,...allDependencyNames(value)]), ['react','scheduler','firebase']);
});
test('actual Firebase database importer preserves filtered data without network writes', async () => {
  const Importer = require('./lib/database/import.js').default;
  const importer = new Importer(new URL('https://example.invalid/root'), Readable.from([JSON.stringify({selected:{a:1,b:{ok:true}},ignored:{secret:1}})]), 'selected', 1024, 1);
  const batches = [];
  importer.doWriteBatch = async batch => {batches.push(batch); return {status:200};};
  await importer.readAndWriteChunks();
  assert.equal(batches.length, 1);
  assert.deepEqual(batches[0].json, {a:1,b:{ok:true}});
  assert.equal(batches[0].pathname, '/root/selected');
});
test('patched pick and filter reject nesting above the upstream safety limit', async () => {
  const deep = '{"x":'.repeat(1100)+'0'+'}'.repeat(1100);
  await assert.rejects(collect(deep, parserStream(), pick.asStream({filter:'missing'})), /depth|nest/i);
  await assert.rejects(collect(deep, filter.withParserAsStream({filter:'missing'})), /depth|nest/i);
});
test('malformed JSON fails rather than producing a successful import', async () => {
  await assert.rejects(collect('{"a":', filter.withParserAsStream({filter:()=>true}), streamObject.asStream()));
});
test('unexpected CLI contents fail closed before either file is modified', () => {
  const temp = mkdtempSync(join(tmpdir(), 'hydra-cli-patch-'));
  try {
    cpSync(new URL('./patch-cli.mjs', import.meta.url), join(temp,'patch-cli.mjs'));
    const cli = join(temp,'node_modules/firebase-tools');
    mkdirSync(cli,{recursive:true});
    writeFileSync(join(cli,'package.json'), JSON.stringify({version:'15.30.2'}));
    const json = join(temp,'node_modules/stream-json');
    mkdirSync(join(json,'src'),{recursive:true});
    writeFileSync(join(json,'package.json'), JSON.stringify({version:'3.6.0',main:'src/index.js'}));
    writeFileSync(join(json,'src/index.js'),'');
    const paths = ['lib/database/import.js','lib/frameworks/next/index.js'];
    for (const path of paths) {
      const target = join(cli,path);
      mkdirSync(join(target,'..'),{recursive:true});
      cpSync(new URL(`./node_modules/firebase-tools/${path}`,import.meta.url),target);
    }
    const first = readFileSync(join(cli,paths[0]),'utf8');
    writeFileSync(join(cli,paths[1]),'unrecognized upstream change');
    assert.throws(()=>execFileSync(process.execPath,[join(temp,'patch-cli.mjs')],{stdio:'pipe'}), /Unrecognized Firebase source/);
    assert.equal(readFileSync(join(cli,paths[0]),'utf8'),first);
    assert.equal(readFileSync(join(cli,paths[1]),'utf8'),'unrecognized upstream change');
  } finally {rmSync(temp,{recursive:true,force:true});}
});
