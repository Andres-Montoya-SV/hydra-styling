import {describe,it,expect} from 'vitest';
import fixture from './fixtures/hydra-assets.json';
import {parseHydraExport,parseHydraExportJSON,getExportWarnings,HYDRA_EXPORT_MAX_BYTES} from './lib/hydra-export';

const copy=()=>structuredClone(fixture);
describe('Hydra Python export contract',()=>{
  it('reads data produced by actual Host.to_dict and serialize_relationship',()=>{
    const result=parseHydraExport(fixture);
    expect(result.success).toBe(true);
    if(!result.success)return;
    expect(result.data.hosts[0].last_seen).toBe('2026-09-19T10:00:00.123456+00:00');
    expect(result.data.hosts[0].confidence).toBe('low');
    expect(result.data.hosts[0].risk_level).toBe('high');
    expect(result.data.intelligence.relationships[0].target_entity).toBe('ip_address:192.0.2.10');
    expect(result.data).not.toHaveProperty('graph');
    expect(result.data.hosts[0]).not.toHaveProperty('profile');
  });
  it.each([
    (v:any)=>{v.host_count=3;},
    (v:any)=>{v.alive_count=0;},
    (v:any)=>{v.hosts[0].confidence_score=101;},
    (v:any)=>{v.hosts[0].risk_score='75';},
    (v:any)=>{v.hosts[0].last_seen='2026-02-30T00:00:00Z';},
    (v:any)=>{v.hosts[0].dns_resolved='false';},
    (v:any)=>{v.hosts[0].ips=['999.1.1.1'];},
    (v:any)=>{v.hosts[0].ports[0].port=65536;},
    (v:any)=>{v.hosts[0].finding_count=0;},
    (v:any)=>{v.hosts[0].http_count=0;},
    (v:any)=>{v.hosts[1].domain=v.hosts[0].domain;},
    (v:any)=>{v.intelligence.relationships[0].run_id='different-run';},
    (v:any)=>{v.intelligence.relationships.push(v.intelligence.relationships[0]);},
    (v:any)=>{v.schema_version=2;},
    (v:any)=>{delete v.intelligence;},
  ])('rejects malformed or inconsistent exports %#',mutate=>{const value=copy();mutate(value);expect(parseHydraExport(value).success).toBe(false);});
  it('accepts actual optional backend timestamps and nullable HTTP statuses without inventing defaults',()=>{
    const value=copy();value.hosts[0].last_seen=null as unknown as string;value.hosts[0].http_services[0].status_code=null as unknown as number;
    const result=parseHydraExport(value);expect(result.success).toBe(true);
    if(result.success){expect(result.data.hosts[0].last_seen).toBeNull();expect(result.data.hosts[0].http_services[0].status_code).toBeNull();}
  });
  it('reports truncated findings and ports and never promises full relationship coverage',()=>{
    const value=copy();value.hosts[0].finding_count=80;value.hosts[0].port_count=90;
    const result=parseHydraExport(value);expect(result.success).toBe(true);
    if(result.success){const warnings=getExportWarnings(result.data).join(' ');expect(warnings).toContain('1 of 80');expect(warnings).toContain('1 of 90');expect(warnings).toContain('coverage is unknown');expect(warnings).toContain('not confirmed vulnerabilities');}
  });
  it('bounds JSON size by UTF-8 bytes and reports syntax errors',()=>{
    expect(parseHydraExportJSON('{bad')).toEqual({success:false,errors:['The file is not valid JSON.']});
    expect(parseHydraExportJSON('é'.repeat(HYDRA_EXPORT_MAX_BYTES/2+1))).toEqual({success:false,errors:['Export exceeds the 5 MiB import limit.']});
    expect(parseHydraExportJSON(JSON.stringify(fixture)).success).toBe(true);
  });
  it('handles unknown inputs and limits diagnostics',()=>{
    expect(parseHydraExport(null).success).toBe(false);
    expect(parseHydraExport([]).success).toBe(false);
    const result=parseHydraExport({...fixture,hosts:new Array(100).fill({})});
    if(!result.success)expect(result.errors.length).toBeLessThanOrEqual(20);
  });
});
