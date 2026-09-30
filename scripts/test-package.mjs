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
    const ui=await import('@hydra-security/ui');
    for(const name of ['Calendar','Modal','Tabs','OtpInput','Dropdown','CodeMockup','DensityProvider','useFieldControl','PasswordInput']) {
      if(!ui[name] || !require('@hydra-security/ui')[name]) throw Error('Missing catalog export: '+name);
    }
    const {createElement}=await import('react');
    const {renderToString}=await import('react-dom/server');
    if(!renderToString(createElement(ui.Calendar,{defaultValue:'2026-09-30'})).includes('September 2026')) throw Error('Calendar SSR failed in installed package.');
    const {readFileSync}=await import('node:fs');
    const css=readFileSync(require.resolve('@hydra-security/ui/styles.css'),'utf8');
    if(!css.includes('.hydra-calendar') || !css.includes('.hydra-modal')) throw Error('Catalog styles missing from package.');
    const grpc=require('@grpc/grpc-js/package.json').version.split('.').map(Number);
    if(grpc[0]<1 || (grpc[0]===1 && (grpc[1]<13 || (grpc[1]===13 && grpc[2]<6)))) throw Error('Starter installed an affected gRPC transport.');
  `],{cwd:app,stdio:'inherit'});
  if(check.status!==0)throw new Error('Published exports failed the consumer smoke test.');
  console.log('Packed library installed and built in a clean consumer; ESM/CJS and rules exports passed.');
} finally {await rm(temp,{recursive:true,force:true});}
