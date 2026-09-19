import {useId,useRef,useState} from 'react';

export type AssetKind='domain'|'subdomain'|'ip'|'service'|'vulnerability';
export interface MapAsset {id:string;label:string;kind:AssetKind;x:number;y:number;detail?:string}
export interface MapRelation {source:string;target:string;label:string}
export interface AssetMapProps {nodes:MapAsset[];edges:MapRelation[];onSelect?:(node:MapAsset)=>void;decorative?:boolean}
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
export function AssetMap({nodes,edges,onSelect,decorative=true}:AssetMapProps){
 const uid=useId().replace(/:/g,'');const root=useRef<HTMLDivElement>(null);
 const [zoom,setZoom]=useState(1);const [pan,setPan]=useState({x:0,y:0});const [selected,setSelected]=useState<string|null>(null);const [expanded,setExpanded]=useState(false);
 const drag=useRef<{x:number;y:number;px:number;py:number}|null>(null);
 const byId=new Map(nodes.map(n=>[n.id,n]));const current=selected?byId.get(selected):undefined;
 const validEdges=edges.filter(e=>byId.has(e.source)&&byId.has(e.target));
 function choose(node:MapAsset){setSelected(node.id);onSelect?.(node);}
 function fit(){setZoom(1);setPan({x:0,y:0});}
 return <section ref={root} className={`hydra-asset-map ${expanded?'hydra-map-expanded':''}`} aria-label="Asset map">
  <header className="hydra-map-header"><h2>✣ &nbsp; Asset Map</h2><ul aria-label="Asset types">{Object.entries(colors).map(([kind,color])=><li key={kind}><span style={{background:color}}/>{kind==='ip'?'IP':kind[0].toUpperCase()+kind.slice(1)}</li>)}</ul></header>
  <div className="hydra-map-toolbar" role="group" aria-label="Map controls"><button type="button" aria-label="Zoom in" disabled={zoom>=2.5} onClick={()=>setZoom(z=>Math.min(2.5,z+.25))}>+</button><button type="button" aria-label="Zoom out" disabled={zoom<=.75} onClick={()=>setZoom(z=>Math.max(.75,z-.25))}>−</button><button type="button" aria-label="Fit map" onClick={fit}>⤢</button><button type="button" aria-label={expanded?'Reduce map':'Expand map'} aria-pressed={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'↙':'↗'}</button><output aria-label="Zoom level">{Math.round(zoom*100)}%</output></div>
  <div className="hydra-map-viewport">
   <svg viewBox={`${500-500/zoom-pan.x} ${260-260/zoom-pan.y} ${1000/zoom} ${520/zoom}`} role="group" aria-label="Interactive asset relationships" tabIndex={0}
    onKeyDown={e=>{if(e.target!==e.currentTarget)return;const delta={ArrowLeft:[30,0],ArrowRight:[-30,0],ArrowUp:[0,30],ArrowDown:[0,-30]}[e.key];if(delta){e.preventDefault();setPan(p=>({x:p.x+delta[0],y:p.y+delta[1]}));}if(e.key==='Home'){e.preventDefault();fit();}if(e.key==='Escape')setExpanded(false);}}
    onPointerDown={e=>{if((e.target as Element).closest('[data-asset]')||e.button!==0)return;drag.current={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};e.currentTarget.setPointerCapture(e.pointerId);}}
    onPointerMove={e=>{if(!drag.current)return;const box=e.currentTarget.getBoundingClientRect();const scale=Math.min(box.width/1000,box.height/520)*zoom;setPan({x:drag.current.px+(e.clientX-drag.current.x)/scale,y:drag.current.py+(e.clientY-drag.current.y)/scale});}}
    onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
    <defs><radialGradient id={`${uid}-sky`}><stop stopColor="#0b3440"/><stop offset="1" stopColor="#031923"/></radialGradient><pattern id={`${uid}-grain`} width="23" height="19" patternUnits="userSpaceOnUse"><circle cx="2" cy="5" r=".6" fill="#cbbd83" opacity=".1"/><circle cx="16" cy="13" r=".5" fill="#5b9a78" opacity=".15"/></pattern></defs>
    <rect x="-3000" y="-3000" width="7000" height="7000" fill={`url(#${uid}-sky)`}/><rect width="1000" height="520" fill={`url(#${uid}-grain)`}/>
    {decorative&&<g aria-hidden="true" opacity=".65" pointerEvents="none">{[[48,200,.8],[118,90,.5],[287,185,.7],[422,111,.5],[578,111,.6],[727,241,.8],[905,145,.8],[937,417,1],[843,472,.7],[651,468,.8],[378,463,.9],[224,427,.7],[56,418,.9],[548,460,.7],[755,97,.6]].map(([x,y,scale],i)=><Tree key={i} x={x} y={y} scale={scale}/>)}{Array.from({length:18},(_,i)=><path key={i} d={`M${30+i*53} ${480-(i%4)*110}q-16-20-10-29q11 7 10 29q16-29 20-24q-1 20-20 24`} fill="#234f37"/>)}</g>}
    <g aria-hidden="true" pointerEvents="none">{validEdges.map((edge,i)=>{const a=byId.get(edge.source)!,b=byId.get(edge.target)!;const mid=(a.x+b.x)/2;const d=`M${a.x} ${a.y-20} C${mid} ${a.y-20},${mid} ${b.y-20},${b.x} ${b.y-20}`;const connected=selected===a.id||selected===b.id;return <g key={`${edge.source}-${edge.target}-${i}`} opacity={selected && !connected ? .24 : 1}><path d={d} fill="none" stroke="#295945" strokeWidth={connected?4:2.5}/><path d={d} fill="none" stroke={colors[b.kind]} strokeWidth="2" strokeDasharray="35 17 6 12"/><circle cx={b.x} cy={b.y-20} r="3" fill={colors[b.kind]}/></g>;})}</g>
    {nodes.map(node=><g data-asset={node.id} key={node.id} transform={`translate(${node.x} ${node.y})`} role="button" tabIndex={0} aria-label={`${node.label}, ${node.kind}`} aria-pressed={selected===node.id} onClick={()=>choose(node)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(node);}}} className="hydra-map-node"><title>{node.label+" — "+node.kind}</title>{node.kind==='domain'&&<circle cy="-30" r="65" fill="#0a3846"/>}<Glyph kind={node.kind}/><rect x="-89" y="5" width="178" height="33" rx="13" fill="#041e29" stroke={selected===node.id? '#ffe3a0':colors[node.kind]} strokeOpacity={selected===node.id?1:.5} strokeWidth="2"/><text y="26" textAnchor="middle" fill="#f6edd9" fontSize="13" fontFamily="system-ui,sans-serif">{node.label.length>24?node.label.slice(0,21)+'…':node.label}</text></g>)}
   </svg>
  </div>
  <div className="hydra-map-detail" aria-live="polite">{current?<><strong>{current.label}</strong><span>{current.kind} · {current.detail??'Selected asset'}</span><ul>{validEdges.filter(e=>e.source===current.id||e.target===current.id).map((e,i)=><li key={i}>{byId.get(e.source)!.label} → {e.label} → {byId.get(e.target)!.label}</li>)}</ul><button type="button" onClick={()=>setSelected(null)}>Clear selection</button></>:<span>Select an asset to inspect its relationships. Drag the canvas to pan; use arrow keys when the map is focused. Home resets the view.</span>}</div>
  {!nodes.length&&<p className="hydra-map-detail">No assets to display.</p>}
 </section>;
}
