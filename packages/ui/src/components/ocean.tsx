import {motion} from 'framer-motion';
import {useHydraMotion} from './motion';

/** Decorative, non-interactive ambient layer. The provider and OS can stop it. */
export function OceanBackground() {
  const active = useHydraMotion();
  return <div className="hydra-ocean" aria-hidden="true">
    <motion.div className="hydra-ocean-light" animate={active?{x:['-3%','3%','-3%'],rotate:[-7,7,-7]}:{x:0,rotate:0}} transition={active?{duration:24,repeat:Infinity,ease:'easeInOut'}:{duration:0}}/>
    <motion.div className="hydra-ocean-caustics" animate={active?{x:['-2%','2%','-2%'],y:['0%','3%','0%']}:{x:0,y:0}} transition={active?{duration:18,repeat:Infinity,ease:'easeInOut'}:{duration:0}}/>
    <div className="hydra-ocean-floor"/>
  </div>;
}

export function SiteLoader({label='Loading Hydra…'}:{label?:string}) {
  const active=useHydraMotion();
  return <div className="hydra-loader" role="status" aria-live="polite">
    <motion.span aria-hidden="true" className="hydra-loader-ring" animate={active?{rotate:360}:{rotate:0}} transition={active?{duration:2,repeat:Infinity,ease:'linear'}:{duration:0}}/>
    <span>{label}</span>
  </div>;
}
