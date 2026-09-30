// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {MotionProvider,Motion,useHydraMotion} from './components/motion';
import {Field,Input} from './components/field';
const spies={cancel:vi.fn(),animate:vi.fn()};
const originalAnimate=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'animate');
let reduced=false;let listeners:Set<()=>void>;
beforeEach(()=>{Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,writable:true,value:spies.animate});reduced=false;listeners=new Set();spies.animate.mockReset();spies.cancel.mockReset();spies.animate.mockReturnValue({cancel:spies.cancel});vi.stubGlobal('matchMedia',()=>({get matches(){return reduced;},addEventListener:(_:string,cb:()=>void)=>listeners.add(cb),removeEventListener:(_:string,cb:()=>void)=>listeners.delete(cb)}));});
afterEach(()=>{cleanup();vi.unstubAllGlobals();if(originalAnimate)Object.defineProperty(HTMLElement.prototype,'animate',originalAnimate);else Reflect.deleteProperty(HTMLElement.prototype,'animate');});
function State(){return <span>{useHydraMotion()?'moving':'still'}</span>;}
it('parent off prevents nested animations',()=>{render(<MotionProvider enabled={false}><MotionProvider><Motion><State/></Motion></MotionProvider></MotionProvider>);expect(screen.getByText('still')).toBeInTheDocument();expect(spies.animate).not.toHaveBeenCalled();});
it('OS preference stops running animations and removes listeners on unmount',()=>{const r=render(<MotionProvider><Motion><State/></Motion></MotionProvider>);expect(screen.getByText('moving')).toBeInTheDocument();act(()=>{reduced=true;listeners.forEach(cb=>cb());});expect(screen.getByText('still')).toBeInTheDocument();expect(spies.cancel).toHaveBeenCalled();r.unmount();expect(listeners.size).toBe(0);});
it('focus animates the control and blur restores it',()=>{render(<MotionProvider><Field label="Domain"><Input/></Field></MotionProvider>);fireEvent.focusIn(screen.getByLabelText('Domain'));expect(spies.animate).toHaveBeenCalledTimes(1);fireEvent.focusOut(screen.getByLabelText('Domain'));expect(spies.cancel).toHaveBeenCalledTimes(1);});
it('disabling motion reverts the active animation',()=>{const r=render(<MotionProvider><Motion>Example</Motion></MotionProvider>);r.rerender(<MotionProvider enabled={false}><Motion>Example</Motion></MotionProvider>);expect(spies.cancel).toHaveBeenCalled();});

it('pauses when the document is hidden and resumes when visible',()=>{
 render(<MotionProvider><Motion><State/></Motion></MotionProvider>);
 const hidden=vi.spyOn(document,'hidden','get');
 hidden.mockReturnValue(true);fireEvent(document,new Event('visibilitychange'));
 expect(screen.getByText('still')).toBeInTheDocument();expect(spies.cancel).toHaveBeenCalled();
 hidden.mockReturnValue(false);fireEvent(document,new Event('visibilitychange'));
 expect(screen.getByText('moving')).toBeInTheDocument();hidden.mockRestore();
});

it('keeps content usable when Web Animations is unavailable',()=>{Reflect.deleteProperty(HTMLElement.prototype,'animate');render(<MotionProvider><Motion><Field label="Target"><Input/></Field></Motion></MotionProvider>);fireEvent.focusIn(screen.getByLabelText('Target'));expect(screen.getByLabelText('Target')).toBeVisible();expect(spies.animate).not.toHaveBeenCalled();});
