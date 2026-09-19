import {HydraMark,FolkSun} from './hydra-mark';
import {Motion} from './motion';
export type FooterVariant='simple'|'complete'|'expressive';
export interface FooterProps {variant?:FooterVariant;tagline?:string;copyright?:string;groups?:{title:string;links:{label:string;href:string}[]}[]}
export function Footer({variant='complete',tagline='Know your territory. Protect what matters.',copyright='Hydra Security',groups=[]}:FooterProps){
 return <footer className={`hydra-footer hydra-footer-${variant}`}>
  {variant==='expressive'&&<Motion><div className="hydra-footer-hero"><FolkSun className="size-20 text-hydra-accent"/><p className="font-display text-4xl md:text-6xl">Security rooted<br/>in discovery.</p><div className="hydra-footer-landscape" aria-hidden="true"/></div></Motion>}
  <div className="hydra-footer-body"><div><HydraMark wordmark className="w-44"/>{variant!=='simple'&&<p className="mt-4 max-w-xs text-sm text-hydra-muted">{tagline}</p>}</div>
  {variant!=='simple'&&groups.map(group=><nav key={group.title} aria-label={group.title}><h3 className="mb-3 font-semibold">{group.title}</h3><ul className="grid gap-3">{group.links.map(link=><li key={link.href}><a className="text-sm text-hydra-muted hover:text-hydra-accent focus-visible:outline-2" href={link.href}>{link.label}</a></li>)}</ul></nav>)}</div>
  <div className="hydra-footer-bottom"><span>© {copyright}</span><span>Crafted with purpose · El Salvador</span></div>
 </footer>;
}
