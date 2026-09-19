import {createContext,useContext,useEffect,useRef,useState,type HTMLAttributes,type ReactNode} from 'react';
import {animate} from 'animejs';

const MotionContext=createContext<boolean|null>(null);
export function useHydraMotion(){return useContext(MotionContext)===true;}
export function MotionProvider({enabled=true,children}:{enabled?:boolean;children:ReactNode}){
 const [reduced,setReduced]=useState(true);
 const parent=useContext(MotionContext);
 // Parent opt-out and the OS preference always win over a nested opt-in.
 useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 const active=enabled&&!reduced&&parent!==false;
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=root.current;if(!el||!active)return;
  const animations=new Map<Element,ReturnType<typeof animate>>();
  const focus=(event:FocusEvent)=>{
   const target=event.target;if(!(target instanceof HTMLElement)||target.closest('[data-hydra-motion]')!==el)return;
   const control=target.closest<HTMLElement>('.hydra-control');if(!control)return;
   animations.get(control)?.revert();
   animations.set(control,animate(control,{boxShadow:['0 0 0 0px transparent','0 0 0 3px var(--hs-focus)','0 0 0 1px var(--hs-focus)'],duration:320,ease:'outQuad'}));
  };
  const blur=(event:FocusEvent)=>{const target=event.target;if(!(target instanceof HTMLElement))return;const control=target.closest('.hydra-control');if(control){animations.get(control)?.revert();animations.delete(control);}};
  el.addEventListener('focusin',focus);el.addEventListener('focusout',blur);
  return()=>{el.removeEventListener('focusin',focus);el.removeEventListener('focusout',blur);animations.forEach(a=>a.revert());};
 },[active]);
 return <MotionContext.Provider value={active}><div ref={root} data-hydra-motion={active?'on':'off'}>{children}</div></MotionContext.Provider>;
}

export function Motion({children,enabled=true,...props}:HTMLAttributes<HTMLDivElement>&{enabled?:boolean}){
 const active=useHydraMotion();const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!active||!enabled||!root.current)return;const animation=animate(root.current,{opacity:[.6,1],translateY:[8,0],duration:300,ease:'outQuad'});return()=>{animation.revert();};},[active,enabled]);
 return <div ref={root} {...props}>{children}</div>;
}
