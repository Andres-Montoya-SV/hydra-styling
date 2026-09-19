// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {AssetMap,type MapAsset} from './components/asset-map';
afterEach(cleanup);
const nodes:MapAsset[]=[{id:'a',label:'example.com',kind:'domain',x:500,y:250},{id:'b',label:'HTTPS',kind:'service',x:700,y:350}];
it('selects nodes by keyboard and describes cross-links',()=>{const selected=vi.fn();render(<AssetMap nodes={nodes} edges={[{source:'a',target:'b',label:'exposes'},{source:'b',target:'a',label:'belongs to'}]} onSelect={selected}/>);fireEvent.keyDown(screen.getByRole('button',{name:'example.com, domain'}),{key:'Enter'});expect(selected).toHaveBeenCalledWith(nodes[0]);expect(screen.getByText('example.com → exposes → HTTPS')).toBeInTheDocument();expect(screen.getByText('HTTPS → belongs to → example.com')).toBeInTheDocument();});
it('bounds zoom and resets the view',()=>{render(<AssetMap nodes={nodes} edges={[]}/>);const plus=screen.getByRole('button',{name:'Zoom in'});for(let i=0;i<10;i++)fireEvent.click(plus);expect(plus).toBeDisabled();expect(screen.getByLabelText('Zoom level')).toHaveTextContent('250%');fireEvent.click(screen.getByRole('button',{name:'Fit map'}));expect(screen.getByLabelText('Zoom level')).toHaveTextContent('100%');});
it('handles empty graphs and ignores dangling edges',()=>{render(<AssetMap nodes={[]} edges={[{source:'missing',target:'other',label:'invalid'}]}/>);expect(screen.getByText('No assets to display.')).toBeInTheDocument();});
it('expands in place and clears the selected asset',()=>{render(<AssetMap nodes={nodes} edges={[]}/>);fireEvent.click(screen.getByRole('button',{name:'Expand map'}));expect(screen.getByRole('button',{name:'Reduce map'})).toHaveAttribute('aria-pressed','true');fireEvent.click(screen.getByRole('button',{name:'HTTPS, service'}));fireEvent.click(screen.getByRole('button',{name:'Clear selection'}));expect(screen.getByRole('button',{name:'HTTPS, service'})).toHaveAttribute('aria-pressed','false');});
