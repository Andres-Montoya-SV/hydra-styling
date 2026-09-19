import {mkdtemp,cp,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const root=resolve('.');
const temp=await mkdtemp(join(tmpdir(),'hydra-consumer-'));
function npm(args,cwd, capture=false){
  const result=spawnSync(process.execPath,[process.env.npm_execpath,...args],{cwd,encoding:'utf8',stdio:capture?'pipe':'inherit',env:{...process.env,npm_config_ignore_scripts:'true'}});
  if(result.status!==0)throw new Error(`npm ${args.join(' ')} failed: ${result.stderr??result.error??''}`);
  return result.stdout;
}
try {
  const packed=JSON.parse(npm(['pack','-w','@hydra-security/ui','--json','--pack-destination',temp],root,true))[0];
  const app=join(temp,'consumer');
  await cp(join(root,'packages/ui/starter'),app,{recursive:true,filter:source=>!source.split('/').some(part=>['node_modules','dist'].includes(part))&&!source.endsWith('.env.local')});
  const pkg=JSON.parse(await readFile(join(app,'package.json'),'utf8'));
  pkg.dependencies['@hydra-security/ui']=`file:${join(temp,packed.filename)}`;
  await writeFile(join(app,'package.json'),JSON.stringify(pkg,null,2));
  npm(['install','--ignore-scripts','--no-audit','--no-fund'],app);
  npm(['run','build'],app);
  const check=spawnSync(process.execPath,['--input-type=module','-e',`
    import {createRequire} from 'node:module';
    const require=createRequire(import.meta.url);
    for(const entry of ['@hydra-security/ui','@hydra-security/ui/firebase','@hydra-security/ui/hydra']) {
      await import(entry); require(entry);
    }
    for(const entry of ['@hydra-security/ui/styles.css','@hydra-security/ui/firebase-rules/firestore.rules','@hydra-security/ui/firebase-rules/storage.rules']) require.resolve(entry);
  `],{cwd:app,stdio:'inherit'});
  if(check.status!==0)throw new Error('Published exports failed the consumer smoke test.');
  console.log('Packed library installed and built in a clean consumer; ESM/CJS and rules exports passed.');
} finally {await rm(temp,{recursive:true,force:true});}
