import {HydraMark} from './hydra-mark';
import {RoseWindow} from './vitral';
import {Motion} from './motion';
import type {ReactNode} from 'react';
import {useHydraLocale} from './locale';
export type FooterVariant='simple'|'complete'|'expressive';
export interface FooterProps {variant?:FooterVariant;tagline?:string;copyright?:string;headline?:ReactNode;credit?:ReactNode;groups?:{title:string;links:{label:string;href:string}[]}[]}
export function Footer({variant='complete',tagline,copyright='Hydra Security',headline,credit,groups=[]}:FooterProps){
 const {messages}=useHydraLocale();
 if(tagline===undefined)tagline=messages.footerTagline;
 return <footer className={`hydra-footer hydra-footer-${variant}`}>
  {variant==='expressive'&&<Motion><div className="hydra-footer-hero"><RoseWindow/><p className="font-display text-4xl md:text-6xl">{headline===undefined?<>{messages.footerHeadline}<br/>{messages.footerHorizon}</>:headline}</p></div></Motion>}
  <div className="hydra-footer-body"><div><HydraMark wordmark className="w-44"/>{variant!=='simple'&&<p className="mt-4 max-w-xs text-sm text-hydra-muted">{tagline}</p>}</div>
  {variant!=='simple'&&groups.map(group=><nav key={group.title} aria-label={group.title}><h3 className="mb-3 font-semibold">{group.title}</h3><ul className="grid gap-3">{group.links.map(link=><li key={link.href}><a className="text-sm text-hydra-muted hover:text-hydra-accent focus-visible:outline-2" href={link.href}>{link.label}</a></li>)}</ul></nav>)}</div>
  <div className="hydra-footer-bottom"><span>© {copyright}</span><span>{credit===undefined?messages.footerCredit:credit}</span></div>
 </footer>;
}
