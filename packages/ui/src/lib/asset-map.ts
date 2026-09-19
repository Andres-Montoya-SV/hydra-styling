import type {MapAsset} from '../components/asset-map';

export interface AssetPosition {id:string;x:number;y:number}
export type AssetLayout = AssetPosition[];
export const assetKinds = ['domain','subdomain','ip','service','vulnerability'] as const;
const record = (v:unknown):v is Record<string,unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v:unknown,max=512):v is string => typeof v==='string' && v.trim().length>0 && v.length<=max;
const coordinate = (v:unknown):v is number => typeof v==='number' && Number.isFinite(v) && Math.abs(v)<=1e6;

/** Validate untrusted API data before rendering. Labels are plain text, never HTML. */
export function validateAssetGraph(nodes:unknown,edges:unknown):string[] {
 const errors:string[]=[];
 if(!Array.isArray(nodes)||!Array.isArray(edges))return ['Nodes and edges must be arrays.'];
 if(nodes.length>1000||edges.length>5000)return ['Graph exceeds the limit of 1000 assets or 5000 relationships.'];
 const ids=new Set<string>();
 nodes.forEach((n,i)=>{
  if(!record(n)){errors.push(`Asset ${i+1} must be an object.`);return;}
  if(!text(n.id,128))errors.push(`Asset ${i+1} has an invalid ID.`);
  else {if(ids.has(n.id))errors.push(`Duplicate asset ID: ${n.id}.`);ids.add(n.id);}
  if(!text(n.label))errors.push(`Asset ${i+1} needs a label (1–512 characters).`);
  if(!assetKinds.includes(n.kind as MapAsset['kind']))errors.push(`Asset ${i+1} has an unknown kind.`);
  if(!coordinate(n.x)||!coordinate(n.y))errors.push(`Asset ${i+1} has invalid coordinates.`);
  if(n.detail!==undefined&&(typeof n.detail!=='string'||n.detail.length>4000))errors.push(`Asset ${i+1} has invalid detail.`);
 });
 const relations=new Set<string>();
 edges.forEach((e,i)=>{
  if(!record(e)){errors.push(`Relationship ${i+1} must be an object.`);return;}
  if(!text(e.source,128)||!text(e.target,128)||!ids.has(e.source)||!ids.has(e.target))errors.push(`Relationship ${i+1} references an unknown asset.`);
  if(!text(e.label))errors.push(`Relationship ${i+1} needs a label.`);
  const key=JSON.stringify([e.source,e.target,e.label]);
  if(relations.has(key))errors.push(`Relationship ${i+1} is duplicated.`);
  relations.add(key);
 });
 return errors.slice(0,100);
}

export function clampPosition(node:Pick<MapAsset,'id'|'kind'>,x:number,y:number):AssetPosition {
 return {id:node.id,x:Math.max(92,Math.min(908,x)),y:Math.max(node.kind==='domain'?100:56,Math.min(480,y))};
}

/** SVG uses xMidYMid meet; subtract letterboxing before converting screen points. */
export function mapPoint(clientX:number,clientY:number,box:{left:number;top:number;width:number;height:number},zoom:number,pan:{x:number;y:number}) {
 const scale=Math.min(box.width/1000,box.height/520)*zoom;
 if(!Number.isFinite(scale)||scale<=0)return null;
 return {x:500-pan.x+(clientX-box.left-box.width/2)/scale,y:260-pan.y+(clientY-box.top-box.height/2)/scale};
}

export function decodeLayout(raw:string,nodes:MapAsset[]):AssetLayout {
 if(raw.length>250000)throw new Error('Saved layout is too large.');
 const value:unknown=JSON.parse(raw);
 if(!record(value)||value.version!==1||!Array.isArray(value.positions)||value.positions.length>1000)throw new Error('Invalid saved layout.');
 const byId=new Map(nodes.map(n=>[n.id,n]));const seen=new Set<string>();const result:AssetLayout=[];
 for(const p of value.positions){
  if(!record(p)||!text(p.id,128)||seen.has(p.id)||!coordinate(p.x)||!coordinate(p.y))throw new Error('Invalid saved position.');
  seen.add(p.id);const node=byId.get(p.id);
  if(node)result.push(clampPosition(node,p.x,p.y));
 }
 return result;
}

/** Attach to the full glyph/label envelope, with ports that stay outside it. */
export function relationPath(a:MapAsset,b:MapAsset,lane=0):string {
 const top=(n:MapAsset)=>n.y-(n.kind==='domain'?98:54);
 const center=(n:MapAsset)=>({x:n.x,y:(top(n)+n.y+40)/2});
 const ac=center(a),bc=center(b);
 if(a.id===b.id||Math.hypot(ac.x-bc.x,ac.y-bc.y)<1){
  return `M ${a.x} ${top(a)} C ${a.x} ${top(a)-90-lane*20}, ${b.x+170+lane*20} ${top(b)-90}, ${b.x+92} ${bc.y}`;
 }
 const dx=bc.x-ac.x,dy=bc.y-ac.y;
 const horizontal=Math.abs(dx)/184>=Math.abs(dy)/Math.max(a.y+40-top(a),b.y+40-top(b));
 const sign=(horizontal?dx:dy)>=0?1:-1;
 const offset=Math.min(24,lane*8);
 const p=horizontal?{x:a.x+sign*92,y:ac.y+offset}:{x:a.x+offset,y:sign>0?a.y+40:top(a)};
 const q=horizontal?{x:b.x-sign*92,y:bc.y+offset}:{x:b.x+offset,y:sign>0?top(b):b.y+40};
 const distance=Math.max(8,Math.abs(horizontal?q.x-p.x:q.y-p.y)*.45)+lane*20;
 return horizontal?`M ${p.x} ${p.y} C ${p.x+sign*distance} ${p.y}, ${q.x-sign*distance} ${q.y}, ${q.x} ${q.y}`:`M ${p.x} ${p.y} C ${p.x} ${p.y+sign*distance}, ${q.x} ${q.y-sign*distance}, ${q.x} ${q.y}`;
}
