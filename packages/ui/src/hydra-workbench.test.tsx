// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {afterEach,it,expect,vi} from 'vitest';
import {cleanup,render,screen,fireEvent,within} from '@testing-library/react';
import fixture from './fixtures/hydra-assets.json';
import {parseHydraExport} from './lib/hydra-export';
import {HydraHostInventory,HydraHostDetails,HydraRelationships,HydraRunSummary} from './components/hydra-workbench';
import {ResourceState} from './components/resource-state';
const parsed=parseHydraExport(fixture);
if(!parsed.success)throw new Error(parsed.errors.join('\n'));
const run=parsed.data;
afterEach(cleanup);

it('keeps risk, confidence and finding observations distinct',()=>{
  const onSelect=vi.fn();render(<HydraHostInventory hosts={run.hosts} onSelect={onSelect}/>);
  fireEvent.change(screen.getByLabelText('Host risk'),{target:{value:'high'}});
  fireEvent.change(screen.getByLabelText('Host confidence'),{target:{value:'low'}});
  expect(screen.queryByRole('button',{name:'example.com'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'api.example.com'}));expect(onSelect).toHaveBeenCalledWith(run.hosts[0]);
  expect(screen.getByText('Not provided by this export')).toBeInTheDocument();
  expect(screen.getByText(/Wildcard DNS/)).toBeInTheDocument();
  expect(screen.getByText(/Soft 404/)).toBeInTheDocument();
  expect(screen.getByText(/Verification flags and reportability assessments are unavailable/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Close host details'}));expect(screen.queryByText('Not provided by this export')).not.toBeInTheDocument();
});
it('paginates, searches and resets pagination without dropping source records',()=>{
  const hosts=Array.from({length:41},(_,i)=>({...run.hosts[0],domain:`host-${String(i).padStart(2,'0')}.example.com`}));
  render(<HydraHostInventory hosts={hosts}/>);
  expect(screen.getAllByRole('row')).toHaveLength(21);
  fireEvent.click(screen.getByRole('button',{name:'Next page'}));expect(screen.getByText('Page 2 of 3 · 41 results')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Search observed hosts'),{target:{value:'HOST-40'}});expect(screen.getByText('Page 1 of 1 · 1 results')).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Next page'})).toBeDisabled();expect(hosts).toHaveLength(41);
  fireEvent.change(screen.getByLabelText('Search observed hosts'),{target:{value:'missing'}});expect(screen.getByText('No hosts match these filters.')).toBeInTheDocument();
});
it('renders untrusted findings and URLs as plain text without requests or navigation',()=>{
  const host=structuredClone(run.hosts[0]);host.findings[0].description='<img src=x onerror=alert(1)>';host.findings[0].url='javascript:alert(1)';
  const {container}=render(<HydraHostDetails host={host}/>);
  expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument();expect(container.querySelector('img,a,iframe,script')).toBeNull();
});
it('exposes canonical relationship evidence without interpreting scope as ownership',()=>{
  render(<HydraRelationships relationships={run.intelligence.relationships}/>);
  expect(screen.getByText('demo-evidence')).toBeInTheDocument();expect(screen.getByText(/not proof that both endpoints/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Search relationships'),{target:{value:'not-found'}});expect(screen.getByText(/No relationships in this view/)).toBeInTheDocument();
});
it('labels snapshot counts without implying current liveness',()=>{
  render(<HydraRunSummary run={run}/>);expect(screen.getByText('Hosts with HTTP records')).toBeInTheDocument();expect(screen.getByText(/do not establish current reachability/)).toBeInTheDocument();
});
it('provides reusable loading, error with retry, and empty states',()=>{
  const retry=vi.fn();const {rerender}=render(<ResourceState status="loading"/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true');
  rerender(<ResourceState status="error" message="Request failed" onRetry={retry}/>);fireEvent.click(within(screen.getByRole('alert')).getByRole('button',{name:'Try again'}));expect(retry).toHaveBeenCalledOnce();
  rerender(<ResourceState status="empty"/>);expect(screen.getByRole('status')).toHaveTextContent('No data available.');
});
