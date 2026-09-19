import {z} from 'zod';

// Audited against AssetStore.export_run_json / Host.to_dict / serialize_relationship.
export const HYDRA_BACKEND_REVISION = 'dc15beba5b789a55f192f654cb00f8e27e6b1e26';
export const HYDRA_EXPORT_MAX_BYTES = 5 * 1024 * 1024;
const text = z.string().max(20000);
const identifier = z.string().min(1).max(2048);
const count = z.number().int().min(0).max(1_000_000);
const score = z.number().min(0).max(100);
// Preserve missing/naive dates; never manufacture observation times.
const timestamp = z.union([z.iso.datetime({offset:true,local:true}),z.literal(''),z.null()]);
const texts = z.array(text).max(1000);

const findingSchema = z.object({
  template_id:identifier, severity:identifier, name:identifier, source:identifier,
  url:text.nullable(), description:text, confidence_score:score,
});
const serviceSchema = z.object({url:identifier, status_code:z.number().int().min(0).max(599).nullable(), title:text.nullable()});
const portSchema = z.object({
  port:z.number().int().min(1).max(65535), protocol:identifier, source:identifier,
  confidence_score:score, verification_state:identifier, service:text.nullable(), version:text.nullable(),
});
const hostSchema = z.object({
  domain:identifier, hostname:text, root_domain:text, subdomain:text,
  ips:z.array(z.union([z.ipv4(),z.ipv6()])).max(1000),
  confidence:z.enum(['high','medium','low','unknown']), confidence_score:score,
  risk_level:z.enum(['critical','high','medium','low','info']), risk_score:score,
  risk_reasons:texts, discovery_sources:texts, warnings:texts,
  dns_resolved:z.boolean(), dns_unconfirmed_http_response:z.boolean(),
  dns_wildcard:z.boolean(), tarpit_suspected:z.boolean(), soft_404_detected:z.boolean(),
  first_seen:timestamp, last_seen:timestamp, scan_timestamp:timestamp,
  http_count:count, port_count:count, url_count:count, finding_count:count,
  http_services:z.array(serviceSchema).max(5000), ports:z.array(portSchema).max(50),
  findings:z.array(findingSchema).max(50),
}).superRefine((host,ctx)=>{
  if(host.finding_count<host.findings.length)ctx.addIssue({code:'custom',path:['finding_count'],message:'Count is smaller than the exported findings.'});
  if(host.port_count<host.ports.length)ctx.addIssue({code:'custom',path:['port_count'],message:'Count is smaller than the exported ports.'});
  if(host.http_count!==host.http_services.length)ctx.addIssue({code:'custom',path:['http_count'],message:'Count does not match exported HTTP services.'});
});
const relationshipSchema = z.object({
  relationship_id:identifier, source_entity:identifier, target_entity:identifier,
  relationship_type:identifier,
  confidence_band:z.enum(['VERY_HIGH','HIGH','MEDIUM','LOW','VERY_LOW']),
  strength:text, evidence_id:text.nullable(), evidence_ids:z.array(identifier).max(1000),
  evidence_type:text, source_artifact:text, source_plugin:text, run_id:identifier,
  explanation:text, rationale:text, observed_at:timestamp,
  collection_status:z.enum(['','DISCOVERED','ELIGIBLE','IN_FLIGHT','COLLECTED','FAILED','NOT_ALLOWED','REJECTED','PARTIAL','NOT_COLLECTED']),
  scope_status:z.enum(['','IN_SCOPE','OUT_OF_SCOPE','UNKNOWN']),
});

/** Projection of fields rendered by the UI. Unused backend fields are stripped. */
export const hydraExportSchema = z.object({
  schema_version:z.never().optional(),
  run_id:identifier, host_count:count, alive_count:count,
  hosts:z.array(hostSchema).max(10000),
  intelligence:z.object({relationships:z.array(relationshipSchema).max(500)}),
}).superRefine((run,ctx)=>{
  if(run.host_count!==run.hosts.length)ctx.addIssue({code:'custom',path:['host_count'],message:'Count does not match the host list.'});
  if(run.alive_count!==run.hosts.filter(h=>h.http_count>0).length)ctx.addIssue({code:'custom',path:['alive_count'],message:'Count does not match hosts with exported HTTP services.'});
  const hosts=new Set<string>();
  run.hosts.forEach((h,i)=>{if(hosts.has(h.domain))ctx.addIssue({code:'custom',path:['hosts',i,'domain'],message:'Duplicate host.'});hosts.add(h.domain);});
  const relationships=new Set<string>();
  run.intelligence.relationships.forEach((r,i)=>{
    if(r.run_id!==run.run_id)ctx.addIssue({code:'custom',path:['intelligence','relationships',i,'run_id'],message:'Relationship belongs to another run.'});
    if(relationships.has(r.relationship_id))ctx.addIssue({code:'custom',path:['intelligence','relationships',i,'relationship_id'],message:'Duplicate relationship.'});
    relationships.add(r.relationship_id);
  });
});

export type HydraExport = z.infer<typeof hydraExportSchema>;
export type HydraHost = HydraExport['hosts'][number];
export type HydraFinding = HydraHost['findings'][number];
export type HydraRelationship = HydraExport['intelligence']['relationships'][number];
export type HydraParseResult = {success:true;data:HydraExport}|{success:false;errors:string[]};

export function parseHydraExport(input:unknown):HydraParseResult {
  const result=hydraExportSchema.safeParse(input);
  return result.success?{success:true,data:result.data}:{success:false,errors:result.error.issues.slice(0,20).map(issue=>`${issue.path.join('.')||'export'}: ${issue.message}`)};
}

/** Use this at the text/file boundary before parsing untrusted local JSON. */
export function parseHydraExportJSON(input:string):HydraParseResult {
  if(input.length>HYDRA_EXPORT_MAX_BYTES||new TextEncoder().encode(input).byteLength>HYDRA_EXPORT_MAX_BYTES)return {success:false,errors:['Export exceeds the 5 MiB import limit.']};
  try{return parseHydraExport(JSON.parse(input));}
  catch{return {success:false,errors:['The file is not valid JSON.']};}
}

export function getExportWarnings(run:HydraExport):string[] {
  const warnings=[
    'Read-only snapshot. Ownership, authorization and verification decisions are not included in this export.',
    'Exported findings are observations to review, not confirmed vulnerabilities.',
    'Relationship coverage is unknown: this backend export has a 500-row cap and can return an empty list after an export error.',
  ];
  const findings=run.hosts.reduce((sum,h)=>sum+h.findings.length,0);
  const totalFindings=run.hosts.reduce((sum,h)=>sum+h.finding_count,0);
  const ports=run.hosts.reduce((sum,h)=>sum+h.ports.length,0);
  const totalPorts=run.hosts.reduce((sum,h)=>sum+h.port_count,0);
  if(findings<totalFindings)warnings.push(`Partial findings: ${findings} of ${totalFindings} exported (maximum 50 per host).`);
  if(ports<totalPorts)warnings.push(`Partial ports: ${ports} of ${totalPorts} exported (maximum 50 per host).`);
  return warnings;
}
