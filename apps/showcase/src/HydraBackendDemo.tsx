import {useState} from 'react';
import {Alert,Button,Card,CardContent,HydraRunSummary,HydraHostInventory,HydraRelationships} from '@hydra-security/ui';
import {HydraExportImport,getExportWarnings,parseHydraExport,type HydraExport} from '@hydra-security/ui/hydra';
import fixture from '../../../packages/ui/src/fixtures/hydra-assets.json';

const example=parseHydraExport(fixture);
if(!example.success)throw new Error('The bundled backend contract example is invalid.');
const exampleRun=example.data;

/** No backend URLs, credentials, implicit fetches or scan actions in the showcase. */
export default function HydraBackendDemo() {
  const [run,setRun]=useState<HydraExport>(exampleRun);
  const [source,setSource]=useState('Synthetic example generated with Hydra serializers');
  const [revision,setRevision]=useState(0);
  const [importRevision,setImportRevision]=useState(0);
  function reset(){setImportRevision(n=>n+1);setRevision(n=>n+1);setRun(exampleRun);setSource('Synthetic example generated with Hydra serializers');}
  return <div className="grid gap-6">
    <Card><CardContent className="grid gap-4"><h2 className="font-display text-2xl">Hydra run explorer</h2>
      <p className="text-sm text-hydra-muted">Open the assets.json file from an existing Hydra run. Processing stays in this tab; files are not uploaded or saved. This view does not start scans.</p>
      <HydraExportImport key={importRevision} onImport={(data,name)=>{setRun(data);setSource(`Imported locally: ${name}`);setRevision(n=>n+1);}}/>
      <Button variant="secondary" onClick={reset}>Load synthetic example</Button>
    </CardContent></Card>
    <p className="break-all text-sm text-hydra-muted">{source}</p>
    <Alert tone="warning" title="Snapshot coverage"><ul className="list-inside list-disc">{getExportWarnings(run).map(warning=><li key={warning}>{warning}</li>)}</ul></Alert>
    <HydraRunSummary run={run}/>
    <HydraHostInventory key={`hosts:${revision}`} hosts={run.hosts}/>
    <HydraRelationships key={`relations:${revision}`} relationships={run.intelligence.relationships}/>
  </div>;
}
