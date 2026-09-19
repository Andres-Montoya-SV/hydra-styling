import {useId,useState} from 'react';
import type {HydraExport,HydraHost,HydraRelationship} from '../lib/hydra-export';
import {Card,CardHeader,CardTitle,CardContent} from './card';
import {Field,Input,Select} from './field';
import {Badge} from './badge';
import {Button} from './button';
import {Alert} from './feedback';
import {ResourceState} from './resource-state';

const pageSize=20;
const riskOrder:Record<HydraHost['risk_level'],number>={critical:4,high:3,medium:2,low:1,info:0};
const cell='border-b border-hydra-line p-3 align-top';
const date=(value:string|null)=>value||'Not provided';

function Pagination({page,total,onChange,label}:{page:number;total:number;onChange:(page:number)=>void;label:string}) {
  const pages=Math.max(1,Math.ceil(total/pageSize));
  return <nav aria-label={label} className="flex flex-wrap items-center justify-between gap-3">
    <Button variant="secondary" disabled={page===0} onClick={()=>onChange(page-1)}>Previous page</Button>
    <span className="text-sm" role="status">Page {page+1} of {pages} · {total} results</span>
    <Button variant="secondary" disabled={page+1>=pages} onClick={()=>onChange(page+1)}>Next page</Button>
  </nav>;
}

export function HydraRunSummary({run}:{run:HydraExport}) {
  const findings=run.hosts.reduce((sum,h)=>sum+h.finding_count,0);
  return <Card><CardHeader><CardTitle>Run snapshot</CardTitle><p className="break-all font-mono text-xs text-hydra-muted">{run.run_id}</p></CardHeader>
    <CardContent><dl className="grid grid-cols-2 gap-5 md:grid-cols-4">
      {[['Hosts',run.host_count],['Hosts with HTTP records',run.alive_count],['Reported findings',findings],['Exported relationships',run.intelligence.relationships.length]].map(([label,value])=><div key={label}><dt className="text-xs text-hydra-muted">{label}</dt><dd className="mt-1 font-display text-3xl">{value}</dd></div>)}
    </dl><p className="mt-4 text-sm text-hydra-muted">Historical observations. HTTP records do not establish current reachability. Finding totals include records omitted by the export limit.</p></CardContent>
  </Card>;
}

export function HydraHostDetails({host}:{host:HydraHost}) {
  const title=useId();
  const anomalies=[
    host.dns_unconfirmed_http_response&&'HTTP response without confirmed DNS: a proxy-generated response may be involved.',
    host.dns_wildcard&&'Wildcard DNS: discovered names need independent validation.',
    host.tarpit_suspected&&'Possible tarpit: port observations are unreliable.',
    host.soft_404_detected&&'Soft 404: HTTP success does not establish that a path exists.',
  ].filter((value):value is string=>!!value);
  return <section aria-labelledby={title} className="grid gap-5 rounded-hydra border border-hydra-accent/40 bg-hydra-surface p-5">
    <h3 id={title} className="break-all font-display text-2xl">{host.domain}</h3>
    <dl className="grid gap-4 text-sm md:grid-cols-2">
      <div><dt className="text-hydra-muted">Risk / confidence</dt><dd>{host.risk_level} · {host.risk_score}/100 / {host.confidence} · {host.confidence_score}/100</dd></div>
      <div><dt className="text-hydra-muted">Discovery sources</dt><dd>{host.discovery_sources.join(', ')||'Not provided'}</dd></div>
      <div><dt className="text-hydra-muted">First seen</dt><dd>{date(host.first_seen)}</dd></div>
      <div><dt className="text-hydra-muted">Last seen</dt><dd>{date(host.last_seen)}</dd></div>
      <div><dt className="text-hydra-muted">Addresses</dt><dd className="break-all">{host.ips.join(', ')||'None exported'}</dd></div>
      <div><dt className="text-hydra-muted">Ownership / verification</dt><dd>Not provided by this export</dd></div>
    </dl>
    {(anomalies.length>0||host.warnings.length>0)&&<Alert tone="warning" title="Evidence limitations"><ul className="list-inside list-disc">{[...anomalies,...host.warnings].map((text,i)=><li key={i}>{text}</li>)}</ul></Alert>}
    {host.risk_reasons.length>0&&<div><h4 className="font-semibold">Backend risk rationale</h4><ul className="list-inside list-disc text-sm">{host.risk_reasons.map((reason,i)=><li key={i}>{reason}</li>)}</ul></div>}
    <div><h4 className="font-semibold">Finding observations · {host.findings.length} of {host.finding_count} exported</h4>
      <p className="mb-3 text-sm text-hydra-muted">Review required. Verification flags and reportability assessments are unavailable here.</p>
      {!host.findings.length?<p>No finding records exported. This does not prove the host is safe.</p>:host.findings.map((finding,i)=><details key={JSON.stringify([finding.template_id,finding.url,i])} className="border-t border-hydra-line py-3">
        <summary className="cursor-pointer font-semibold">{finding.name} <span className="font-normal">· severity {finding.severity} · confidence {finding.confidence_score}/100</span></summary>
        <dl className="mt-3 grid gap-2 break-words text-sm"><dt>Detector / source</dt><dd>{finding.template_id} / {finding.source}</dd><dt>Description</dt><dd className="whitespace-pre-wrap">{finding.description||'Not provided'}</dd><dt>Observed URL</dt><dd className="break-all">{finding.url||'Not provided'}</dd></dl>
      </details>)}
    </div>
    <details><summary className="cursor-pointer font-semibold">Port observations · {host.ports.length} of {host.port_count} exported</summary>
      <ul className="mt-3 grid gap-2 text-sm">{host.ports.map((port,i)=><li key={i}>{port.port}/{port.protocol} · {port.service||'unknown service'} · {port.verification_state} · source {port.source}</li>)}</ul>
    </details>
    <details><summary className="cursor-pointer font-semibold">HTTP observations · {host.http_count}</summary>
      <ul className="mt-3 grid gap-2 break-all text-sm">{host.http_services.map((service,i)=><li key={i}>{service.url} · status {service.status_code??'unknown'} · {service.title||'No title'}</li>)}</ul>
    </details>
  </section>;
}

export interface HydraHostInventoryProps {hosts:HydraHost[];onSelect?:(host:HydraHost)=>void}
export function HydraHostInventory({hosts,onSelect}:HydraHostInventoryProps) {
  const [query,setQuery]=useState('');const [risk,setRisk]=useState('all');const [confidence,setConfidence]=useState('all');
  const [sort,setSort]=useState('risk');const [page,setPage]=useState(0);const [selected,setSelected]=useState<string|null>(null);
  const needle=query.trim().toLowerCase();
  const rows=hosts.filter(h=>(risk==='all'||h.risk_level===risk)&&(confidence==='all'||h.confidence===confidence)&&[h.domain,...h.ips,...h.discovery_sources].some(s=>s.toLowerCase().includes(needle)))
    .sort((a,b)=>sort==='name'?a.domain.localeCompare(b.domain):riskOrder[b.risk_level]-riskOrder[a.risk_level]||b.risk_score-a.risk_score||a.domain.localeCompare(b.domain));
  const currentPage=Math.min(page,Math.max(0,Math.ceil(rows.length/pageSize)-1));
  const current=hosts.find(h=>h.domain===selected);
  return <Card><CardHeader><CardTitle>Observed hosts</CardTitle><p className="text-sm text-hydra-muted">Risk and confidence are separate backend signals.</p></CardHeader><CardContent className="grid gap-5">
    <div className="grid gap-3 md:grid-cols-4">
      <Field label="Search observed hosts"><Input type="search" placeholder="Hostname, IP or source" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}}/></Field>
      <Field label="Host risk"><Select value={risk} onChange={e=>{setRisk(e.target.value);setPage(0);}}><option value="all">All risks</option>{Object.keys(riskOrder).map(r=><option key={r}>{r}</option>)}</Select></Field>
      <Field label="Host confidence"><Select value={confidence} onChange={e=>{setConfidence(e.target.value);setPage(0);}}><option value="all">All confidence levels</option>{['high','medium','low','unknown'].map(c=><option key={c}>{c}</option>)}</Select></Field>
      <Field label="Sort hosts"><Select value={sort} onChange={e=>{setSort(e.target.value);setPage(0);}}><option value="risk">Risk priority</option><option value="name">Hostname</option></Select></Field>
    </div>
    {!rows.length?<ResourceState status="empty" message="No hosts match these filters."/>:<div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Host observations from the imported run</caption><thead><tr>{['Host','Risk','Confidence','Findings exported'].map(h=><th key={h} scope="col" className={cell}>{h}</th>)}</tr></thead><tbody>
      {rows.slice(currentPage*pageSize,(currentPage+1)*pageSize).map(host=><tr key={host.domain}><th scope="row" className={cell}><button type="button" className="break-all text-hydra-accent underline underline-offset-4" aria-pressed={selected===host.domain} onClick={()=>{setSelected(host.domain);onSelect?.(host);}}>{host.domain}</button></th><td className={cell}>{host.risk_level} · {host.risk_score}/100</td><td className={cell}>{host.confidence} · {host.confidence_score}/100</td><td className={cell}>{host.findings.length} / {host.finding_count}</td></tr>)}
    </tbody></table></div>}
    <Pagination page={currentPage} total={rows.length} onChange={setPage} label="Host pages"/>
    {current&&<><HydraHostDetails host={current}/><Button variant="secondary" onClick={()=>setSelected(null)}>Close host details</Button></>}
  </CardContent></Card>;
}

export function HydraRelationships({relationships}:{relationships:HydraRelationship[]}) {
  const [query,setQuery]=useState('');const [page,setPage]=useState(0);
  const rows=relationships.filter(r=>[r.source_entity,r.target_entity,r.relationship_type].some(s=>s.toLowerCase().includes(query.trim().toLowerCase())));
  const currentPage=Math.min(page,Math.max(0,Math.ceil(rows.length/pageSize)-1));
  return <Card><CardHeader><CardTitle>Relationship evidence</CardTitle><p className="text-sm text-hydra-muted">A shared IP or certificate does not prove shared ownership.</p></CardHeader><CardContent className="grid gap-4">
    <Field label="Search relationships"><Input type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}}/></Field>
    {!rows.length&&<ResourceState status="empty" message="No relationships in this view. Export coverage is unknown."/>}
    {rows.slice(currentPage*pageSize,(currentPage+1)*pageSize).map(r=><details key={r.relationship_id} className="rounded-hydra border border-hydra-line p-4">
      <summary className="cursor-pointer break-all text-sm"><strong>{r.source_entity}</strong> → {r.relationship_type} → <strong>{r.target_entity}</strong> <Badge>{r.confidence_band}</Badge></summary>
      <dl className="mt-4 grid gap-2 break-words text-sm"><dt>Backend explanation</dt><dd>{r.explanation||'Not provided'}</dd><dt>Source / collector</dt><dd>{r.source_artifact||'Not provided'} / {r.source_plugin||'Not provided'}</dd><dt>Evidence references</dt><dd className="break-all">{r.evidence_ids.join(', ')||r.evidence_id||'Not provided'}</dd><dt>Observed at</dt><dd>{date(r.observed_at)}</dd><dt>Scope / collection context</dt><dd>{r.scope_status||'Unknown'} / {r.collection_status||'Unknown'}</dd></dl>
      <p className="mt-3 text-xs text-hydra-muted">Scope is backend context for this relationship, not proof that both endpoints can be scanned. Evidence references are identifiers, not downloadable files.</p>
    </details>)}
    <Pagination page={currentPage} total={rows.length} onChange={setPage} label="Relationship pages"/>
  </CardContent></Card>;
}
