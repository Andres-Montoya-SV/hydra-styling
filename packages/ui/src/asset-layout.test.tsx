// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {AssetMap,type MapAsset} from './components/asset-map';
import {validateAssetGraph,decodeLayout,mapPoint,relationPath} from './lib/asset-map';
const nodes:MapAsset[]=[{id:'a',label:'example.com',kind:'domain',x:500,y:250},{id:'b',label:'HTTPS',kind:'service',x:800,y:350}];
class TestPointerEvent extends MouseEvent {pointerId:number;constructor(type:string,init:PointerEventInit){super(type,init);this.pointerId=init.pointerId??1;}}
beforeEach(()=>{localStorage.clear();vi.stubGlobal('PointerEvent',TestPointerEvent);});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
function canvas(){const svg=screen.getByLabelText('Interactive asset relationships') as unknown as SVGSVGElement;svg.setPointerCapture=vi.fn();svg.hasPointerCapture=()=>true;svg.releasePointerCapture=vi.fn();vi.spyOn(svg,'getBoundingClientRect').mockReturnValue({x:0,y:0,left:0,top:0,right:1000,bottom:700,width:1000,height:700,toJSON:()=>({})});return svg;}
function start(svg:SVGSVGElement){fireEvent.pointerDown(screen.getByRole('button',{name:'example.com, domain'}),{button:0,pointerId:1,clientX:500,clientY:340});return svg;}
it('converts screen coordinates with zoom, pan and letterboxing',()=>{
 expect(mapPoint(500,350,{left:0,top:0,width:1000,height:700},2,{x:20,y:30})).toEqual({x:480,y:230});
 expect(mapPoint(700,450,{left:0,top:0,width:1000,height:700},2,{x:20,y:30})).toEqual({x:580,y:280});
 expect(mapPoint(0,0,{left:0,top:0,width:0,height:0},1,{x:0,y:0})).toBeNull();
});
it('anchors links to envelopes and distinguishes reverse links and loops',()=>{
 expect(relationPath(nodes[0],{...nodes[1],y:228})).toMatch(/^M 592 221 C/);
 expect(relationPath(nodes[0],nodes[1])).not.toEqual(relationPath(nodes[0],nodes[1],1));
 expect(relationPath(nodes[1],nodes[0],1)).not.toEqual(relationPath(nodes[0],nodes[1]));
 expect(relationPath(nodes[0],nodes[0])).toMatch(/^M 500 152 C/);
 expect(relationPath(nodes[0],{...nodes[1],x:500,y:228})).not.toMatch(/NaN|Infinity/);
});
it.each([
 [null,[]],[[null],[]],[[{...nodes[0],x:NaN}],[]],[[{...nodes[0],kind:'script'}],[]],
 [[nodes[0],nodes[0]],[]],[[{...nodes[0],detail:42}],[]],[[{...nodes[0],label:''}],[]],
 [nodes,[{source:'a',target:'missing',label:'exposes'}]],
 [nodes,[{source:'a',target:'b',label:'x'},{source:'a',target:'b',label:'x'}]],
 [new Array(1001).fill(nodes[0]),[]]
])('rejects invalid API data %#',(n,e)=>{expect(validateAssetGraph(n,e).length).toBeGreaterThan(0);});
it('accepts cycles and prototype-like IDs without object lookup hazards',()=>{const n=[{...nodes[0],id:'__proto__'},nodes[1]];expect(validateAssetGraph(n,[{source:'__proto__',target:'b',label:'x'},{source:'b',target:'__proto__',label:'y'}])).toEqual([]);});
it('drags at zoom, updates links, persists on drop and restores on remount',()=>{
 const onLayoutChange=vi.fn();const props={nodes,edges:[{source:'a',target:'b',label:'exposes'}],storageKey:'test',onLayoutChange};
 const {unmount,container}=render(<AssetMap {...props}/>);const svg=canvas();const path=container.querySelector('[data-relationship]')!.getAttribute('d');
 fireEvent.click(screen.getByLabelText('Zoom in'));start(svg);
 fireEvent.pointerMove(svg,{pointerId:1,clientX:625,clientY:402.5});
 expect(screen.getByRole('button',{name:'example.com, domain'})).toHaveAttribute('transform','translate(600 300)');
 expect(container.querySelector('[data-relationship]')!.getAttribute('d')).not.toBe(path);
 expect(localStorage.getItem('test')).toBeNull();
 fireEvent.pointerUp(svg,{pointerId:1});expect(onLayoutChange).toHaveBeenCalledTimes(1);expect(onLayoutChange.mock.calls[0][0]).toHaveLength(2);
 unmount();render(<AssetMap {...props}/>);expect(screen.getByRole('button',{name:'example.com, domain'})).toHaveAttribute('transform','translate(600 300)');
});
it.each(['pointerCancel','lostPointerCapture'])('rolls back %s without saving or removing assets',event=>{
 const save=vi.fn();render(<AssetMap nodes={nodes} edges={[]} onLayoutChange={save}/>);const svg=start(canvas());fireEvent.pointerMove(svg,{pointerId:1,clientX:700,clientY:440});
 fireEvent[event as 'pointerCancel'](svg,{pointerId:1});expect(screen.getByRole('button',{name:'example.com, domain'})).toHaveAttribute('transform','translate(500 250)');expect(save).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'HTTPS, service'})).toBeInTheDocument();
});
it('ignores another pointer and clamps the dragged asset inside the canvas',()=>{
 render(<AssetMap nodes={nodes} edges={[]}/>);const svg=start(canvas());fireEvent.pointerMove(svg,{pointerId:2,clientX:0,clientY:0});expect(screen.getByRole('button',{name:'example.com, domain'})).toHaveAttribute('transform','translate(500 250)');fireEvent.pointerMove(svg,{pointerId:1,clientX:-999,clientY:-999});fireEvent.pointerUp(svg,{pointerId:1});expect(screen.getByRole('button',{name:'example.com, domain'})).toHaveAttribute('transform','translate(92 100)');
});
it('selects with a pointer tap but does not select as a side effect of dragging',()=>{
 const select=vi.fn();render(<AssetMap nodes={nodes} edges={[]} onSelect={select}/>);const svg=start(canvas());fireEvent.pointerUp(svg,{pointerId:1});expect(select).toHaveBeenCalledTimes(1);start(svg);fireEvent.pointerMove(svg,{pointerId:1,clientX:550,clientY:340});fireEvent.pointerUp(svg,{pointerId:1});fireEvent.click(screen.getByRole('button',{name:'example.com, domain'}));expect(select).toHaveBeenCalledTimes(1);
});
it('pans the background without changing asset coordinates and cancels a drag with Escape',()=>{
 const save=vi.fn();render(<AssetMap nodes={nodes} edges={[]} onLayoutChange={save}/>);const svg=canvas();fireEvent.pointerDown(svg,{button:0,pointerId:1,clientX:300,clientY:300});fireEvent.pointerMove(svg,{pointerId:1,clientX:400,clientY:350});fireEvent.pointerUp(svg,{pointerId:1});expect(svg).toHaveAttribute('viewBox','-100 -50 1000 520');expect(save).not.toHaveBeenCalled();start(svg);fireEvent.pointerMove(svg,{pointerId:1,clientX:600,clientY:440});fireEvent.keyDown(svg,{key:'Escape'});expect(screen.getByRole('button',{name:'example.com, domain'})).toHaveAttribute('transform','translate(500 250)');expect(save).not.toHaveBeenCalled();
});
it('moves with keyboard, preserves items on Delete, and isolates storage keys',()=>{
 const {rerender}=render(<AssetMap nodes={nodes} edges={[]} storageKey="one"/>);const a=screen.getByRole('button',{name:'example.com, domain'});fireEvent.keyDown(a,{key:'ArrowRight'});fireEvent.keyDown(a,{key:'ArrowDown',shiftKey:true});fireEvent.keyDown(a,{key:'Delete'});expect(a).toHaveAttribute('transform','translate(510 251)');expect(JSON.parse(localStorage.getItem('one')!).positions).toHaveLength(2);
 rerender(<AssetMap nodes={nodes} edges={[]} storageKey="two"/>);expect(screen.getByRole('button',{name:'example.com, domain'})).toHaveAttribute('transform','translate(500 250)');expect(localStorage.getItem('two')).toBeNull();
});
it('reports corrupted storage and storage write failures while keeping interactions usable',()=>{
 localStorage.setItem('test','{bad');render(<AssetMap nodes={nodes} edges={[]} storageKey="test"/>);expect(screen.getByRole('status',{name:'Layout storage'})).toHaveTextContent('could not be loaded');vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});fireEvent.keyDown(screen.getByRole('button',{name:'example.com, domain'}),{key:'ArrowRight'});expect(screen.getByRole('status',{name:'Layout storage'})).toHaveTextContent('could not be saved');
});
it('rejects unsupported layouts and keeps new assets with their original coordinates',()=>{
 expect(()=>decodeLayout('{"version":2,"positions":[]}',nodes)).toThrow();
 expect(()=>decodeLayout('{"version":1,"positions":[{"id":"a","x":null,"y":5}]}',nodes)).toThrow();
 localStorage.setItem('test',JSON.stringify({version:1,positions:[{id:'a',x:600,y:300},{id:'deleted-upstream',x:3,y:4}]}));render(<AssetMap nodes={nodes} edges={[]} storageKey="test"/>);expect(screen.getByRole('button',{name:'HTTPS, service'})).toHaveAttribute('transform','translate(800 350)');
});
