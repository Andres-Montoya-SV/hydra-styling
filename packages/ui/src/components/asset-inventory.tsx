import {useId,useState} from 'react';
import {assetKinds} from '../lib/asset-map';
import type {AssetKind} from './asset-map';
import {Field,Input,Select} from './field';
import {Card,CardHeader,CardTitle,CardContent} from './card';

export interface InventoryAsset {
 id:string;label:string;kind:AssetKind;
 risk:'unknown'|'low'|'medium'|'high'|'critical';
 ownership:'unverified'|'confirmed'|'third-party';
 source:string;lastSeen:string; evidence:string;
}
export interface AssetInventoryProps {assets:InventoryAsset[];onSelect?:(asset:InventoryAsset)=>void}
const risks=['unknown','low','medium','high','critical'] as const;
const ownerships=['unverified','confirmed','third-party'] as const;
export function validateInventory(assets:unknown):string[] {
 if(!Array.isArray(assets)||assets.length>10000)return ['Inventory must be an array of at most 10000 assets.'];
 const errors:string[]=[];const ids=new Set<string>();
 assets.forEach((a,i)=>{
  if(!a||typeof a!=='object'||Array.isArray(a)){errors.push(`Asset ${i+1} must be an object.`);return;}
  for(const key of ['id','label','source','evidence'])if(typeof a[key]!=='string'||!a[key].trim()||a[key].length>(key==='evidence'?4000:key==='id'?128:512))errors.push(`Asset ${i+1}: invalid ${key}.`);
  if(ids.has(a.id))errors.push(`Asset ${i+1}: duplicate ID.`);ids.add(a.id);
  if(!assetKinds.includes(a.kind)||!risks.includes(a.risk)||!ownerships.includes(a.ownership))errors.push(`Asset ${i+1}: invalid classification.`);
  if(typeof a.lastSeen!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(a.lastSeen)||!Number.isFinite(Date.parse(a.lastSeen))||new Date(a.lastSeen).toISOString()!==a.lastSeen)errors.push(`Asset ${i+1}: lastSeen must be a valid UTC ISO timestamp.`);
 });
 return errors.slice(0,100);
}

/** Read-only triage inventory: discovery is not proof of ownership or vulnerability. */
export function AssetInventory({assets,onSelect}:AssetInventoryProps){
 const [query,setQuery]=useState('');const [kind,setKind]=useState('all');const [risk,setRisk]=useState('all');const [ownership,setOwnership]=useState('all');const [selected,setSelected]=useState<string|null>(null);const heading=useId();
 const errors=validateInventory(assets);
 if(errors.length)return <div role="alert"><strong>Invalid inventory data</strong><ul>{errors.map((e,i)=><li key={i}>{e}</li>)}</ul></div>;
 const rows=assets.filter(a=>(kind==='all'||a.kind===kind)&&(risk==='all'||a.risk===risk)&&(ownership==='all'||a.ownership===ownership)&&`${a.label} ${a.id} ${a.source}`.toLowerCase().includes(query.trim().toLowerCase()));
 const current=assets.find(a=>a.id===selected);
 return <Card><CardHeader><CardTitle>Attack surface inventory</CardTitle><p className="text-sm text-hydra-muted">Review exposure, attribution and discovery evidence.</p></CardHeader><CardContent className="grid gap-5">
  <div className="grid gap-3 md:grid-cols-4"><Field label="Search assets"><Input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Asset or discovery source"/></Field>
  <Field label="Asset type"><Select value={kind} onChange={e=>setKind(e.target.value)}><option value="all">All types</option>{assetKinds.map(k=><option key={k}>{k}</option>)}</Select></Field>
  <Field label="Risk"><Select value={risk} onChange={e=>setRisk(e.target.value)}><option value="all">All risks</option>{risks.map(r=><option key={r}>{r}</option>)}</Select></Field>
  <Field label="Ownership"><Select value={ownership} onChange={e=>setOwnership(e.target.value)}><option value="all">All ownership states</option>{ownerships.map(o=><option key={o}>{o}</option>)}</Select></Field></div>
  <p role="status">{rows.length} of {assets.length} assets</p>
  <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Discovered assets and verification status</caption><thead><tr>{['Asset','Type','Risk','Ownership','Last seen'].map(h=><th key={h} scope="col" className="border-b border-hydra-line p-3">{h}</th>)}</tr></thead><tbody>{rows.map(a=><tr key={a.id}><th scope="row" className="border-b border-hydra-line p-3"><button type="button" className="text-hydra-accent underline underline-offset-4" aria-pressed={a.id===selected} onClick={()=>{setSelected(a.id);onSelect?.(a);}}>{a.label}</button></th><td className="p-3">{a.kind}</td><td className="p-3">{a.risk}</td><td className="p-3">{a.ownership}</td><td className="p-3"><time dateTime={a.lastSeen}>{a.lastSeen.slice(0,10)}</time></td></tr>)}</tbody></table></div>
  {!rows.length&&<p>No assets match these filters.</p>}
  {current&&<section aria-labelledby={heading} className="rounded-hydra border border-hydra-line bg-hydra-surface p-5"><h3 id={heading} className="font-display text-xl">{current.label}</h3><dl className="mt-3 grid gap-2"><dt>Discovery source</dt><dd>{current.source}</dd><dt>Evidence</dt><dd className="whitespace-pre-wrap break-words">{current.evidence}</dd><dt>Ownership</dt><dd>{current.ownership}</dd><dt>Last observed (UTC)</dt><dd>{current.lastSeen}</dd></dl><p className="my-3 text-sm text-hydra-muted">Discovery alone does not confirm ownership. Unknown risk does not mean safe.</p><button type="button" onClick={()=>setSelected(null)}>Close asset details</button></section>}
 </CardContent></Card>;
}
