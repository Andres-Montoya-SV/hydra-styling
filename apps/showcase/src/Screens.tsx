import {useState} from 'react';
import {AssetInventory,type InventoryAsset} from '@hydra-security/ui';
const inventory:InventoryAsset[]=[
 {id:'domain',label:'example.com',kind:'domain',risk:'unknown',ownership:'confirmed',source:'Demo · supplied scope',lastSeen:'2026-09-19T10:00:00.000Z',evidence:'Synthetic asset supplied by the organization. No live discovery was performed.'},
 {id:'api',label:'api.example.com',kind:'subdomain',risk:'high',ownership:'unverified',source:'Demo · certificate transparency',lastSeen:'2026-09-19T10:05:00.000Z',evidence:'Synthetic certificate SAN match. The example risk requires independent verification; the match alone does not prove control.'},
 {id:'ip',label:'104.21.32.12',kind:'ip',risk:'unknown',ownership:'third-party',source:'Demo · DNS relationship',lastSeen:'2026-09-19T10:10:00.000Z',evidence:'Synthetic shared infrastructure relationship. An IP associated with a domain is not automatically owned by the organization.'}
];
import {Footer,Motion,MotionProvider,Field,Input,Button,Card,CardContent,CardHeader,CardTitle,Badge,Switch,AssetRelations,DocumentCard,Alert,Progress} from '@hydra-security/ui';

const groups=[{title:'Explore',links:[{label:'Components',href:'#components'},{label:'Motion',href:'#motion'}]},{title:'Resources',links:[{label:'Reports',href:'#reports'},{label:'Settings',href:'#settings'}]}];
export function FooterScreen(){return <div className="space-y-8">{(['simple','complete','expressive'] as const).map(variant=><section key={variant}><h2 className="mb-3 font-display text-2xl capitalize">{variant}</h2><Footer variant={variant} groups={groups}/></section>)}</div>;}
export function MotionScreen(){
 const [run,setRun]=useState(0);
 return <><Button onClick={()=>setRun(run+1)}>Replay examples</Button><div className="mt-5 grid gap-5 xl:grid-cols-2">{[true,false].map(enabled=><MotionProvider key={String(enabled)+run} enabled={enabled}><Motion><Card><CardHeader><CardTitle>{enabled?'Animated (respects OS preference)':'Without animation'}</CardTitle></CardHeader><CardContent className="grid gap-5"><Field label="Target"><Input placeholder="example.com"/></Field><Button>Primary action</Button><Alert tone="success" title="Ready">Same content, same keyboard behavior.</Alert><Progress value={72} label="Coverage"/></CardContent></Card></Motion></MotionProvider>)}</div></>;
}
export function ProductScreen({screen}:{screen:string}){
 const [query,setQuery]=useState('');const [continuous,setContinuous]=useState(true);const [done,setDone]=useState(false);
 if(screen==='Inventory')return <><p className="mb-4 text-sm text-hydra-muted">Sample data · no live scan or external service connected.</p><AssetInventory assets={inventory}/></>;
 const rows=screen==='Technologies'?['React · web framework','Nginx · web server','PostgreSQL · database']:screen==='Vulnerabilities'?['Exposed admin panel · high','Outdated TLS · medium','Insecure cookie · low']:screen==='Infrastructure'?['104.21.32.12 · HTTPS 443','172.67.45.23 · SSH 22']:screen==='Domains'?['example.com','example.org']:['api.example.com','dev.example.com','staging.example.com'];
 if(screen==='Settings')return <Card><CardContent className="grid gap-5"><Switch label="Continuous monitoring" checked={continuous} onChange={e=>setContinuous(e.target.checked)}/><Alert title="Local demonstration">Preference changes stay in this demo session.</Alert></CardContent></Card>;
 if(screen==='Reports')return <div className="grid gap-4"><DocumentCard name="surface-report.pdf" kind="pdf" meta="Example report"/><DocumentCard name="inventory.csv" kind="csv" meta="Example inventory"/></div>;
 if(screen==='Recon')return <div className="grid gap-5"><form onSubmit={e=>{e.preventDefault();setDone(true);}} className="grid gap-4"><Field label="Target"><Input required value={query} onChange={e=>{setQuery(e.target.value);setDone(false);}}/></Field><Button type="submit">Preview discovery</Button></form>{done&&<Alert title="Demo only">Preview for {query}. No network scan was launched.</Alert>}<AssetRelations root={{id:'root',label:'example.com',children:[{id:'api',label:'api.example.com',relation:'subdomain',children:[{id:'https',label:'HTTPS',relation:'service'}]}]}}/></div>;
 return <Card><CardHeader><CardTitle>{screen}</CardTitle><Badge>Sample data</Badge></CardHeader><CardContent><Field label={`Filter ${screen.toLowerCase()}`}><Input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></Field><ul className="mt-5 divide-y divide-hydra-line">{rows.filter(row=>row.toLowerCase().includes(query.toLowerCase())).map(row=><li key={row} className="py-4 text-sm">{row}</li>)}</ul>{!rows.some(row=>row.toLowerCase().includes(query.toLowerCase()))&&<p className="py-4 text-hydra-muted">No matching results.</p>}</CardContent></Card>;
}
