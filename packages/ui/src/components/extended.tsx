import {useState, type InputHTMLAttributes} from 'react';
import {Input, Field} from './field';
import {Button} from './button';
import {iconSources} from '../icon-sources';
export type HydraIconName = keyof typeof iconSources;
export function HydraIcon({name,label,className='size-6'}:{name:HydraIconName;label?:string;className?:string}) {
 return name.startsWith('08-graphics-motifs/') ? <img src={iconSources[name]} alt={label ?? ''} className={className} /> : <span role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true} className={`inline-block shrink-0 bg-current ${className}`} style={{maskImage:`url("${iconSources[name]}")`,WebkitMaskImage:`url("${iconSources[name]}")`,maskSize:'contain',maskRepeat:'no-repeat',maskPosition:'center'}}/>;
}
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>,'type'>) {
 const [visible,setVisible]=useState(false);
 return <div className="flex min-w-0 gap-2"><Input {...props} type={visible?'text':'password'}/><Button className="shrink-0" variant="outline" disabled={props.disabled} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?'Hide':'Show'} password</Button></div>;
}
export function RangeInput({label,min=0,max=100,...props}:InputHTMLAttributes<HTMLInputElement>&{label:string}) {
 return <Field label={label}><Input {...props} type="range" min={min} max={max}/></Field>;
}
export function FileInput({label,...props}:InputHTMLAttributes<HTMLInputElement>&{label:string}) {
 return <Field label={label} hint="Selection only; files are not uploaded automatically."><Input {...props} type="file"/></Field>;
}
export function RadioGroup({label,name,options,value,onChange,disabled}:{label:string;name:string;options:{value:string;label:string}[];value:string;onChange:(value:string)=>void;disabled?:boolean}) {
 return <fieldset disabled={disabled} className="grid gap-3"><legend className="mb-2 font-semibold">{label}</legend>{options.map(o=><label key={o.value} className="flex gap-2"><input type="radio" name={name} value={o.value} checked={value===o.value} onChange={()=>onChange(o.value)}/>{o.label}</label>)}</fieldset>;
}
export interface AssetNode {id:string;label:string;relation?:string;children?:AssetNode[]}
export function AssetRelations({root}:{root:AssetNode}) {
 const [collapsed,setCollapsed]=useState<Set<string>>(new Set());
 function render(node:AssetNode):React.ReactNode {
  const closed=collapsed.has(node.id); const children=node.children?.length;
  return <li key={node.id} className="hydra-branch"><div className="flex items-center gap-2">{children?<button type="button" aria-expanded={!closed} onClick={()=>setCollapsed(prev=>{const next=new Set(prev);if(next.has(node.id))next.delete(node.id);else next.add(node.id);return next;})} className="rounded border border-hydra-line px-2 py-1 text-hydra-accent">{closed?'+':'−'}<span className="sr-only"> {node.label}</span></button>:<span className="text-hydra-success" aria-hidden="true">●</span>}<span className="text-sm">{node.label}</span>{node.relation&&<span className="text-xs text-hydra-muted">{node.relation}</span>}</div>{children&&!closed&&<ul className="hydra-branches">{node.children!.map(render)}</ul>}</li>;
 }
 return <div className="overflow-auto p-3" aria-label="Asset hierarchy"><ul>{render(root)}</ul></div>;
}
