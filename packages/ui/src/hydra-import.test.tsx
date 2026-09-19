// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {afterEach,it,expect,vi} from 'vitest';
import {act,cleanup,render,screen,fireEvent,waitFor} from '@testing-library/react';
import fixture from './fixtures/hydra-assets.json';
import {HydraExportImport} from './components/hydra-export-import';
import {HYDRA_EXPORT_MAX_BYTES} from './lib/hydra-export';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
function file(text:()=>Promise<string>,size=100,name='assets.json') {
  return {name,size,text} as File;
}
function choose(value:File){fireEvent.change(screen.getByLabelText('Import Hydra assets.json'),{target:{files:[value]}});}

it('imports a valid file without network access or persistent storage',async()=>{
  const onImport=vi.fn();const fetch=vi.spyOn(globalThis,'fetch');const save=vi.spyOn(Storage.prototype,'setItem');
  render(<HydraExportImport onImport={onImport}/>);choose(file(async()=>JSON.stringify(fixture)));
  await waitFor(()=>expect(onImport).toHaveBeenCalledOnce());expect(onImport.mock.calls[0][0].run_id).toBe(fixture.run_id);
  expect(fetch).not.toHaveBeenCalled();expect(save).not.toHaveBeenCalled();
});
it('rejects oversized files before reading them',()=>{
  const read=vi.fn();const onImport=vi.fn();render(<HydraExportImport onImport={onImport}/>);
  choose(file(read,HYDRA_EXPORT_MAX_BYTES+1));expect(screen.getByRole('alert')).toHaveTextContent('exceeds the 5 MiB');expect(read).not.toHaveBeenCalled();expect(onImport).not.toHaveBeenCalled();
});
it.each(['{bad','{}'])('rejects malformed data without replacing the previous snapshot: %s',async text=>{
  const onImport=vi.fn();render(<HydraExportImport onImport={onImport}/>);choose(file(async()=>text));
  expect(await screen.findByRole('alert')).toHaveTextContent('previously loaded snapshot is unchanged');expect(onImport).not.toHaveBeenCalled();
});
it('handles file read failure',async()=>{
  render(<HydraExportImport onImport={vi.fn()}/>);choose(file(async()=>{throw new Error('unreadable');}));expect(await screen.findByRole('alert')).toHaveTextContent('could not be read');
});
it('ignores a slow import when a newer file has finished',async()=>{
  let resolve!:(text:string)=>void;const slow=new Promise<string>(r=>{resolve=r;});const onImport=vi.fn();
  render(<HydraExportImport onImport={onImport}/>);choose(file(()=>slow,100,'slow.json'));
  choose(file(async()=>JSON.stringify(fixture),100,'new.json'));await waitFor(()=>expect(onImport).toHaveBeenCalledOnce());
  await act(async()=>{resolve(JSON.stringify(fixture));});expect(onImport).toHaveBeenCalledTimes(1);expect(onImport.mock.calls[0][1]).toBe('new.json');
});
it.each(['cancel','unmount'])('does not publish a pending import after %s',async action=>{
  let resolve!:(text:string)=>void;const pending=new Promise<string>(r=>{resolve=r;});const onImport=vi.fn();
  const {unmount}=render(<HydraExportImport onImport={onImport}/>);choose(file(()=>pending));
  if(action==='cancel')fireEvent.click(screen.getByRole('button',{name:'Cancel import'}));else unmount();
  await act(async()=>{resolve(JSON.stringify(fixture));});expect(onImport).not.toHaveBeenCalled();
});
