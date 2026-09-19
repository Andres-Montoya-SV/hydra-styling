// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {MotionProvider,Motion,useHydraMotion} from './components/motion';
import {Field,Input} from './components/field';
const spies=vi.hoisted(()=>({revert:vi.fn(),animate:vi.fn()}));
vi.mock('animejs',()=>({animate:spies.animate}));
let reduced=false;let listeners:Set<()=>void>;
beforeEach(()=>{reduced=false;listeners=new Set();spies.animate.mockReset();spies.revert.mockReset();spies.animate.mockReturnValue({revert:spies.revert});vi.stubGlobal('matchMedia',()=>({get matches(){return reduced;},addEventListener:(_:string,cb:()=>void)=>listeners.add(cb),removeEventListener:(_:string,cb:()=>void)=>listeners.delete(cb)}));});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
function State(){return <span>{useHydraMotion()?'moving':'still'}</span>;}
it('parent off prevents nested animations',()=>{render(<MotionProvider enabled={false}><MotionProvider><Motion><State/></Motion></MotionProvider></MotionProvider>);expect(screen.getByText('still')).toBeInTheDocument();expect(spies.animate).not.toHaveBeenCalled();});
it('OS preference stops running animations and removes listeners on unmount',()=>{const r=render(<MotionProvider><Motion><State/></Motion></MotionProvider>);expect(screen.getByText('moving')).toBeInTheDocument();act(()=>{reduced=true;listeners.forEach(cb=>cb());});expect(screen.getByText('still')).toBeInTheDocument();expect(spies.revert).toHaveBeenCalled();r.unmount();expect(listeners.size).toBe(0);});
it('focus animates the control and blur restores it',()=>{render(<MotionProvider><Field label="Domain"><Input/></Field></MotionProvider>);fireEvent.focusIn(screen.getByLabelText('Domain'));expect(spies.animate).toHaveBeenCalledTimes(1);fireEvent.focusOut(screen.getByLabelText('Domain'));expect(spies.revert).toHaveBeenCalledTimes(1);});
it('disabling motion reverts the active animation',()=>{const r=render(<MotionProvider><Motion>Example</Motion></MotionProvider>);r.rerender(<MotionProvider enabled={false}><Motion>Example</Motion></MotionProvider>);expect(spies.revert).toHaveBeenCalled();});
