// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {Field,PasswordInput,AssetRelations,HydraIcon} from './index';
afterEach(cleanup);
it('toggles password without submitting',()=>{render(<Field label="Secret"><PasswordInput defaultValue="abc"/></Field>);expect(screen.getByLabelText('Secret')).toHaveAttribute('type','password');fireEvent.click(screen.getByRole('button'));expect(screen.getByLabelText('Secret')).toHaveAttribute('type','text');});
it('collapses a branch',()=>{render(<AssetRelations root={{id:'r',label:'Domain',children:[{id:'c',label:'HTTPS'}]}}/>);expect(screen.getByText('HTTPS')).toBeInTheDocument();fireEvent.click(screen.getByRole('button'));expect(screen.queryByText('HTTPS')).not.toBeInTheDocument();expect(screen.getByRole('button')).toHaveAttribute('aria-expanded','false');});
it('exposes a named icon and hides decorative ones',()=>{const {container}=render(<><HydraIcon name="01-general-ui/search" label="Search assets"/><HydraIcon name="01-general-ui/search"/></>);expect(screen.getByRole('img',{name:'Search assets'}).style.maskImage).toContain('data:image/svg+xml,');expect(screen.getAllByRole('img')).toHaveLength(1);expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();});
