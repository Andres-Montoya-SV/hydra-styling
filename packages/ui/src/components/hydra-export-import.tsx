import {useEffect,useRef,useState} from 'react';
import {HYDRA_EXPORT_MAX_BYTES,parseHydraExportJSON,type HydraExport} from '../lib/hydra-export';
import {Field,Input} from './field';
import {Alert} from './feedback';
import {Button} from './button';
import {ResourceState} from './resource-state';

export interface HydraExportImportProps {onImport:(run:HydraExport,fileName:string)=>void}

/** A local-only file boundary; it never fetches URLs or persists report contents. */
export function HydraExportImport({onImport}:HydraExportImportProps) {
  const [loading,setLoading]=useState(false);const [errors,setErrors]=useState<string[]>([]);
  const sequence=useRef(0);
  useEffect(()=>()=>{sequence.current++;},[]);
  async function read(file:File|undefined) {
    if(!file)return;
    const request=++sequence.current;
    setErrors([]);setLoading(true);
    let parsed:ReturnType<typeof parseHydraExportJSON>;
    try {
      if(file.size>HYDRA_EXPORT_MAX_BYTES){setErrors(['The file exceeds the 5 MiB import limit.']);setLoading(false);return;}
      parsed=parseHydraExportJSON(await file.text());
    } catch {
      if(request===sequence.current){setErrors(['The file could not be read.']);setLoading(false);}
      return;
    }
    if(request!==sequence.current)return;
    setLoading(false);
    if(!parsed.success){setErrors(parsed.errors);return;}
    onImport(parsed.data,file.name);
  }
  return <div className="grid gap-3">
    <Field label="Import Hydra assets.json"><Input type="file" accept=".json,application/json" onChange={e=>{void read(e.target.files?.[0]);e.target.value='';}}/></Field>
    {loading&&<><ResourceState status="loading" message="Validating the export…"/><Button variant="secondary" onClick={()=>{sequence.current++;setLoading(false);}}>Cancel import</Button></>}
    {errors.length>0&&<Alert tone="danger" title="Import rejected"><p>The previously loaded snapshot is unchanged.</p><ul className="mt-2 list-inside list-disc">{errors.map((error,i)=><li key={i}>{error}</li>)}</ul></Alert>}
  </div>;
}
