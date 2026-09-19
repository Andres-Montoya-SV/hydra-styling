// Reproducible import: supplied archive is read only; emits an apply_patch patch.
import { execFileSync } from 'node:child_process';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import * as icons from 'lucide-react';
const archive = process.argv[2];
const names = execFileSync('unzip', ['-Z1', archive], {encoding:'utf8'}).split('\n').filter(n => /^hydra-icon-pack\/\d[^/]+\/[^/]+\.svg$/.test(n));
const groups = {
 Search:'search whois analyze', Menu:'menu', X:'close failed error false-positive', Ellipsis:'more', Home:'home house admin-panel', Sun:'sun dashboard scan-starting', Moon:'moon', Bell:'notifications', ArrowLeft:'back', ArrowRight:'forward open-redirect redirect', RefreshCw:'refresh', LogOut:'logout', ChevronsLeft:'collapse', Link:'link cname', Copy:'copy', Save:'save', Download:'download export export-chart', Upload:'upload import', Trash2:'trash delete clear', Pencil:'edit', Settings:'settings misconfig options', SlidersHorizontal:'filter sort', CircleHelp:'help', Info:'info', User:'user profile', Users:'team', Share2:'share', Globe:'http geoip location', Lock:'https closed-port', Shield:'safe vulnerable', ShieldCheck:'completed resolved scan-completed', TriangleAlert:'critical high medium warning known-issue attention', Bug:'malware malicious exploit', Eye:'suspicious', Loader:'loading in-progress scan-scanning', Circle:'online', CloudOff:'offline', Clock:'pending history schedule', Lightbulb:'tip', FlaskConical:'beta', Sparkles:'new success scan-finishing', Leaf:'low leaf', FileText:'file txt report generate-report banner cve', FileImage:'image', Archive:'zip', Braces:'json code deserialization', Table:'csv excel table', Presentation:'powerpoint', File:'pdf word', Network:'dns subdomain network-graph tree asn isp cdn mx wildcard', Server:'port service open-port ip', Activity:'ping traceroute scan-progress', KeyRound:'api-key token default-creds exposed-secret weak-crypto', Fingerprint:'cvss', ShieldAlert:'tls', Terminal:'terminal rce rce-java brute brute-force', Code:'xss xxe', Database:'sqli', FolderOpen:'directory-listing path-traversal', FileWarning:'lfi rfi', Router:'ssrf insecure-cors csrf', Cookie:'cookie', Radar:'radar scan recon', List:'enumerate', Puzzle:'plugins', Blocks:'modules', GitCompare:'compare', ChartColumn:'bar-chart stats', ChartLine:'line-chart', ChartArea:'area-chart', ChartPie:'pie-chart', ChartDonut:'donut-chart', TrendingUp:'trend-up', TrendingDown:'trend-down', Gauge:'gauge coverage', Grid3X3:'heatmap', Route:'timeline', Map:'map', ScanSearch:'scan-analyzing', Waves:'water', Mountain:'mountain', Bird:'bird', TreePine:'tree', Flower:'flower', Cloud:'cloud', Star:'star', GitBranch:'branch'
};
const lookup = Object.fromEntries(Object.entries(groups).flatMap(([icon,keys])=>keys.split(' ').map(k=>[k,icon])));
Object.assign(lookup,{fuzz:'Shuffle','pattern-2':'Home','donut-chart':'ChartPie'});
let patch='*** Begin Patch\n';
const records=[];
for(const name of names){
 const parts=name.split('/'); const category=parts[1]; const slug=parts[2].slice(0,-4);
 if(/logo|hydra-sprite/.test(slug)) continue;
 let svg;
 if(category==='08-graphics-motifs' && !['moon','bird','pattern-2'].includes(slug)) {
   svg=execFileSync('unzip',['-p',archive,name],{encoding:'utf8'});
 } else if(category==='05-technologies') {
   svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>${slug}</title><path d="M10 6h44v44l-12 8H10z" fill="#F3A51F" stroke="#062B3A" stroke-width="3"/><text x="32" y="37" text-anchor="middle" font-family="sans-serif" font-size="${slug.length>7?9:11}" font-weight="bold" fill="#062B3A">${slug.toUpperCase()}</text></svg>`;
 } else {
   const key=lookup[slug]; if(!key || !icons[key]) throw Error('Unmapped '+name+' '+key);
   svg=renderToStaticMarkup(createElement(icons[key],{size:64,stroke:'#062B3A',strokeWidth:1.8}));
   svg=svg.replace(/<svg[^>]*>/,'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none" stroke="#062B3A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><title>'+slug+'</title><rect x="1" y="1" width="26" height="26" rx="5" fill="#F3E5C8" stroke="none"/><g transform="translate(2 2)">').replace('</svg>','</g><path d="M3 25h7" stroke="#E76C30" stroke-width="2"/></svg>');
 }
 if(/<script|onload=|href=|foreignObject/i.test(svg)) throw Error('Unsafe SVG '+name);
 const path=`packages/ui/icons/${category}/${slug}.svg`;
 patch+=`*** Add File: ${path}\n`+svg.split('\n').map(l=>'+'+l).join('\n')+'\n';
 records.push({name:category+'/'+slug,svg});
}
const source='// Generated from reviewed static SVG assets. No runtime HTML injection.\nexport const iconSources = '+JSON.stringify(Object.fromEntries(records.map(r=>[r.name,'data:image/svg+xml,'+encodeURIComponent(r.svg)])),null,2)+' as const;\n';
patch+='*** Add File: packages/ui/src/icon-sources.ts\n'+source.split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch';
console.log(patch);
