import {useEffect,useId,useRef,useState} from 'react';
import {clampPosition,decodeLayout,mapPoint,relationPath,validateAssetGraph,type AssetLayout} from '../lib/asset-map';

export type AssetKind='domain'|'subdomain'|'ip'|'service'|'vulnerability';
export interface MapAsset {id:string;label:string;kind:AssetKind;x:number;y:number;detail?:string}
export interface MapRelation {source:string;target:string;label:string}
export interface AssetMapProps {nodes:MapAsset[];edges:MapRelation[];onSelect?:(node:MapAsset)=>void;decorative?:boolean;storageKey?:string;onLayoutChange?:(positions:AssetLayout)=>void}
const colors:Record<AssetKind,string>={domain:'#43b18b',subdomain:'#f4a623',ip:'#55a6c4',service:'#c98a23',vulnerability:'#ef6539'};

function House({large=false}:{large?:boolean}){return <g transform={large?'translate(-43 -67) scale(1.45)':'translate(-27 -48)'}><path d="M8 20h38v32H8z" fill="#e6b858"/><path d="M3 21 27 1l25 20z" fill="#c95027"/><path d="M27 1 39 5l20 16H36z" fill="#9c3a25"/><path d="M20 36h10v16H20zM12 26h7v8h-7zM33 26h7v8h-7z" fill="#073342"/><path d="M10 20h35" stroke="#ffc96a" strokeWidth="2"/>{large&&<g transform="translate(37 16)"><path d="M0 12h23v24H0z" fill="#f4d494"/><path d="m-4 12 15-14 16 14z" fill="#d85c30"/><path d="M8 23h7v13H8z" fill="#123c43"/></g>}</g>;}
function Tree({x,y,scale=1}:{x:number;y:number;scale?:number}){return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M0-5C-37-23-24-59-8-43C-13-75 23-67 17-40C44-47 37-15 0-5Z" fill="#234b32"/><path d="M0 1v-51M0-22l-15-15M0-33l12-14" fill="none" stroke="#ad842c" strokeWidth="3"/><path d="M-3-9Q-22-29-19-14L-3-2M3-8Q19-35 21-19L3-1" fill="#376443"/></g>;}
function Glyph({kind}:{kind:AssetKind}){
 if(kind==='domain'||kind==='subdomain')return <House large={kind==='domain'}/>;
 if(kind==='vulnerability')return <g transform="translate(0 -26)"><path d="M0-25 23 17H-23Z" fill="#e55932" stroke="#ffab51" strokeWidth="1.5"/><path d="M0-10v12" stroke="#142f35" strokeWidth="4"/><circle cy="10" r="2.5" fill="#142f35"/></g>;
 if(kind==='service')return <g transform="translate(-23 -42)" fill="#eda328" stroke="#97581b" strokeWidth="2"><rect width="46" height="14" rx="3"/><rect y="19" width="46" height="14" rx="3"/><circle cx="8" cy="7" r="2" fill="#072e3c"/><circle cx="8" cy="26" r="2" fill="#072e3c"/></g>;
 return <g transform="translate(0 -29)" fill="none" stroke="#55a6c4" strokeWidth="2.5"><circle r="18"/><ellipse rx="8" ry="18"/><path d="M-17-6h34M-17 6h34"/></g>;
}

/** Coordinates use a 1000 x 520 canvas. A graph may include cross-links and cycles. */
export function AssetMap(props:AssetMapProps){
 const errors=validateAssetGraph(props.nodes,props.edges);
 if(errors.length)return <section className="hydra-map-detail" role="alert"><strong>Invalid asset data</strong><ul>{errors.map((error,i)=><li key={i}>{error}</li>)}</ul></section>;
 return <ValidatedAssetMap key={JSON.stringify([props.storageKey,props.nodes.map(n=>[n.id,n.kind])])} {...props}/>;
}

function ValidatedAssetMap({nodes:sourceNodes,edges,onSelect,decorative=true,storageKey,onLayoutChange}:AssetMapProps){
 const uid=useId().replace(/:/g,'');const root=useRef<HTMLDivElement>(null);
 const [positions,setPositions]=useState<AssetLayout>([]);const draft=useRef<AssetLayout>([]);
 const [storageNotice,setStorageNotice]=useState('');const suppressClick=useRef(false);
 useEffect(()=>{
  if(!storageKey)return;
  try {const raw=localStorage.getItem(storageKey);if(raw){const saved=decodeLayout(raw,sourceNodes);draft.current=saved;setPositions(saved);}}
  catch {setStorageNotice('Saved positions could not be loaded. Original positions are shown.');}
 },[storageKey]);
 const overrides=new Map(positions.map(p=>[p.id,p]));
 const nodes=sourceNodes.map(n=>({...n,...overrides.get(n.id)}));
 function update(next:AssetLayout){draft.current=next;setPositions(next);}
 function commit(next:AssetLayout){
  const layout=sourceNodes.map(n=>next.find(p=>p.id===n.id)??{id:n.id,x:n.x,y:n.y});
  if(storageKey){try{localStorage.setItem(storageKey,JSON.stringify({version:1,positions:layout}));setStorageNotice('Positions saved in this browser.');}catch{setStorageNotice('Positions could not be saved in this browser.');}}
  onLayoutChange?.(layout);
 }
 const [zoom,setZoom]=useState(1);const [pan,setPan]=useState({x:0,y:0});const [selected,setSelected]=useState<string|null>(null);const [expanded,setExpanded]=useState(false);
 const drag=useRef<{pointerId:number;x:number;y:number;px:number;py:number;node?:MapAsset;before:AssetLayout;panBefore:{x:number;y:number};moved:boolean}|null>(null);
 const byId=new Map(nodes.map(n=>[n.id,n]));const current=selected?byId.get(selected):undefined;
 const validEdges=edges;
 function choose(node:MapAsset){setSelected(node.id);onSelect?.(node);}
 function fit(){setZoom(1);setPan({x:0,y:0});}
 function finish(cancel=false){const active=drag.current;if(!active)return;drag.current=null;suppressClick.current=active.moved||!!active.node;if(cancel){update(active.before);setPan(active.panBefore);}else if(active.node){if(active.moved)commit(draft.current);else choose(active.node);}}
 return <section ref={root} className={`hydra-asset-map ${expanded?'hydra-map-expanded':''}`} aria-label="Asset map">
  <header className="hydra-map-header"><h2>✣ &nbsp; Asset Map</h2><ul aria-label="Asset types">{Object.entries(colors).map(([kind,color])=><li key={kind}><span style={{background:color}}/>{kind==='ip'?'IP':kind[0].toUpperCase()+kind.slice(1)}</li>)}</ul></header>
  <div className="hydra-map-toolbar" role="group" aria-label="Map controls"><button type="button" aria-label="Zoom in" disabled={zoom>=2.5} onClick={()=>setZoom(z=>Math.min(2.5,z+.25))}>+</button><button type="button" aria-label="Zoom out" disabled={zoom<=.75} onClick={()=>setZoom(z=>Math.max(.75,z-.25))}>−</button><button type="button" aria-label="Fit map" onClick={fit}>⤢</button><button type="button" aria-label={expanded?'Reduce map':'Expand map'} aria-pressed={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'↙':'↗'}</button><output aria-label="Zoom level">{Math.round(zoom*100)}%</output></div>
  <div className="hydra-map-viewport">
   <svg viewBox={`${500-500/zoom-pan.x} ${260-260/zoom-pan.y} ${1000/zoom} ${520/zoom}`} role="group" aria-label="Interactive asset relationships" tabIndex={0}
    onKeyDown={e=>{if(e.target!==e.currentTarget)return;const delta={ArrowLeft:[30,0],ArrowRight:[-30,0],ArrowUp:[0,30],ArrowDown:[0,-30]}[e.key];if(delta){e.preventDefault();setPan(p=>({x:p.x+delta[0],y:p.y+delta[1]}));}if(e.key==='Home'){e.preventDefault();fit();}if(e.key==='Escape'){finish(true);setExpanded(false);}}}
    onPointerDown={e=>{if(e.button!==0||drag.current)return;const point=mapPoint(e.clientX,e.clientY,e.currentTarget.getBoundingClientRect(),zoom,pan);if(!point)return;const id=(e.target as Element).closest('[data-asset]')?.getAttribute('data-asset');const node=id?byId.get(id):undefined;suppressClick.current=false;drag.current={pointerId:e.pointerId,x:e.clientX,y:e.clientY,px:point.x,py:point.y,node,before:draft.current,panBefore:pan,moved:false};e.currentTarget.setPointerCapture(e.pointerId);}}
    onPointerMove={e=>{const active=drag.current;if(!active||active.pointerId!==e.pointerId)return;if(Math.hypot(e.clientX-active.x,e.clientY-active.y)<3&&!active.moved)return;const point=mapPoint(e.clientX,e.clientY,e.currentTarget.getBoundingClientRect(),zoom,active.panBefore);if(!point)return;active.moved=true;const dx=point.x-active.px,dy=point.y-active.py;if(active.node){const p=clampPosition(active.node,active.node.x+dx,active.node.y+dy);update([...draft.current.filter(n=>n.id!==p.id),p]);}else setPan({x:active.panBefore.x+dx,y:active.panBefore.y+dy});}}
    onPointerUp={e=>{if(drag.current?.pointerId!==e.pointerId)return;finish();if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={e=>{if(drag.current?.pointerId===e.pointerId)finish(true);}} onLostPointerCapture={()=>finish(true)}>
    <defs><radialGradient id={`${uid}-sky`}><stop stopColor="#0b3440"/><stop offset="1" stopColor="#031923"/></radialGradient><pattern id={`${uid}-grain`} width="23" height="19" patternUnits="userSpaceOnUse"><circle cx="2" cy="5" r=".6" fill="#cbbd83" opacity=".1"/><circle cx="16" cy="13" r=".5" fill="#5b9a78" opacity=".15"/></pattern></defs>
    <defs>{Object.entries(colors).map(([kind,color])=><marker key={kind} id={`${uid}-${kind}-arrow`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill={color}/></marker>)}</defs>
    <rect x="-3000" y="-3000" width="7000" height="7000" fill={`url(#${uid}-sky)`}/><rect width="1000" height="520" fill={`url(#${uid}-grain)`}/>
    {decorative&&<g aria-hidden="true" opacity=".65" pointerEvents="none">{[[48,200,.8],[118,90,.5],[287,185,.7],[422,111,.5],[578,111,.6],[727,241,.8],[905,145,.8],[937,417,1],[843,472,.7],[651,468,.8],[378,463,.9],[224,427,.7],[56,418,.9],[548,460,.7],[755,97,.6]].map(([x,y,scale],i)=><Tree key={i} x={x} y={y} scale={scale}/>)}{Array.from({length:18},(_,i)=><path key={i} d={`M${30+i*53} ${480-(i%4)*110}q-16-20-10-29q11 7 10 29q16-29 20-24q-1 20-20 24`} fill="#234f37"/>)}</g>}
    <g aria-hidden="true" pointerEvents="none">{validEdges.map((edge,i)=>{const a=byId.get(edge.source)!,b=byId.get(edge.target)!;const lane=validEdges.slice(0,i).filter(e=>(e.source===a.id&&e.target===b.id)||(e.target===a.id&&e.source===b.id)).length;const d=relationPath(a,b,lane);const connected=selected===a.id||selected===b.id;return <g key={JSON.stringify([edge.source,edge.target,edge.label])} opacity={selected && !connected ? .24 : 1}><path data-relationship={`${edge.source}:${edge.target}`} d={d} fill="none" stroke="#295945" strokeWidth={connected?4:2.5}/><path d={d} fill="none" stroke={colors[b.kind]} strokeWidth="2" strokeDasharray="35 17 6 12" markerEnd={`url(#${uid}-${b.kind}-arrow)`}/></g>;})}</g>
    {nodes.map(node=><g data-asset={node.id} key={node.id} transform={`translate(${node.x} ${node.y})`} role="button" tabIndex={0} aria-label={`${node.label}, ${node.kind}`} aria-pressed={selected===node.id} onClick={()=>{if(!suppressClick.current)choose(node);}} aria-description="Drag to move. Arrow keys move by 10 units; Shift moves by 1. Items cannot be deleted." onKeyDown={e=>{const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(delta){e.preventDefault();e.stopPropagation();const step=e.shiftKey?1:10;const p=clampPosition(node,node.x+delta[0]*step,node.y+delta[1]*step);const next=[...draft.current.filter(n=>n.id!==node.id),p];update(next);commit(next);}if(e.key==='Escape'){finish(true);}if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(node);}}} className="hydra-map-node"><title>{node.label+" — "+node.kind}</title>{node.kind==='domain'&&<circle cy="-30" r="65" fill="#0a3846"/>}<Glyph kind={node.kind}/><rect x="-89" y="5" width="178" height="33" rx="13" fill="#041e29" stroke={selected===node.id? '#ffe3a0':colors[node.kind]} strokeOpacity={selected===node.id?1:.5} strokeWidth="2"/><text y="26" textAnchor="middle" fill="#f6edd9" fontSize="13" fontFamily="system-ui,sans-serif">{node.label.length>24?node.label.slice(0,21)+'…':node.label}</text></g>)}
   </svg>
  </div>
  <div className="hydra-map-detail" aria-live="polite">{current?<><strong>{current.label}</strong><span>{current.kind} · {current.detail??'Selected asset'}</span><ul>{validEdges.filter(e=>e.source===current.id||e.target===current.id).map((e,i)=><li key={i}>{byId.get(e.source)!.label} → {e.label} → {byId.get(e.target)!.label}</li>)}</ul><button type="button" onClick={()=>setSelected(null)}>Clear selection</button></>:<span>Select an asset to inspect its relationships. Drag the canvas to pan; use arrow keys when the map is focused. Home resets the view.</span>}</div>
  <p className="hydra-map-detail">Drag assets to move them; arrow keys move a focused asset, Shift moves precisely. Assets cannot be deleted. {storageKey?'Positions are stored in this browser.':'Positions last for this session.'}</p>
  {storageNotice&&<p className="hydra-map-detail" role="status" aria-label="Layout storage">{storageNotice}</p>}
  {!nodes.length&&<p className="hydra-map-detail">No assets to display.</p>}
 </section>;
}
