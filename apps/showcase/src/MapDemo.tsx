import {AssetMap,type MapAsset,type MapRelation} from '@hydra-security/ui';
const nodes:MapAsset[]=[
 {id:'root',label:'example.com',kind:'domain',x:510,y:250,detail:'Primary domain · example data'},
 {id:'api',label:'api.example.com',kind:'subdomain',x:165,y:95},
 {id:'dev',label:'dev.example.com',kind:'subdomain',x:480,y:85},
 {id:'stage',label:'staging.example.com',kind:'subdomain',x:825,y:115},
 {id:'www',label:'www.example.com',kind:'subdomain',x:160,y:245},
 {id:'mail',label:'mail.example.com',kind:'subdomain',x:150,y:435},
 {id:'ip1',label:'104.21.32.12',kind:'ip',x:320,y:340},
 {id:'ip2',label:'192.168.1.10',kind:'ip',x:555,y:435,detail:'Private address · sample relationship, not public reachability'},
 {id:'ip3',label:'172.67.45.23',kind:'ip',x:825,y:355},
 {id:'svc',label:'HTTPS · 443',kind:'service',x:345,y:180},
 {id:'risk',label:'Outdated TLS',kind:'vulnerability',x:745,y:455,detail:'Example finding · medium severity'}
];
const edges:MapRelation[]=[...['api','dev','stage','www','mail'].map(target=>({source:'root',target,label:'has subdomain'})),{source:'api',target:'svc',label:'exposes'},{source:'www',target:'ip1',label:'resolves to'},{source:'dev',target:'ip2',label:'resolves to'},{source:'stage',target:'ip3',label:'resolves to'},{source:'svc',target:'risk',label:'affected by'},{source:'ip3',target:'risk',label:'affected by'}];
export default function MapDemo(){return <AssetMap nodes={nodes} edges={edges}/>;}
