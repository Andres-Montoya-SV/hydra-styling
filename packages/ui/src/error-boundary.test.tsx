// @vitest-environment jsdom
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {ErrorBoundary} from './components/error-boundary';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('contains render errors without exposing details and retries on user request',()=>{
  vi.spyOn(console,'error').mockImplementation(()=>{});
  let broken=true;
  function View(){if(broken)throw new Error('private diagnostic');return <p>Recovered</p>;}
  const report=vi.fn();
  render(<ErrorBoundary onError={report}><View/></ErrorBoundary>);
  expect(screen.getByRole('alert').textContent).not.toContain('private diagnostic');
  expect(report).toHaveBeenCalled();
  broken=false;fireEvent.click(screen.getByText('Try again'));
  expect(screen.getByText('Recovered')).toBeTruthy();
});
