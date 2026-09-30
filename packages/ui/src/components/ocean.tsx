import {motion} from 'framer-motion';
import {useHydraMotion} from './motion';

import {VitralBackground} from './vitral';

/** @deprecated Use VitralBackground. Kept as a visual-compatible migration alias. */
export function OceanBackground() { return <VitralBackground/>; }

export function SiteLoader({label='Loading Hydra…'}:{label?:string}) {
  const active=useHydraMotion();
  return <div className="hydra-loader" role="status" aria-live="polite">
    <motion.span aria-hidden="true" className="hydra-loader-ring" animate={active?{rotate:360}:{rotate:0}} transition={active?{duration:2,repeat:Infinity,ease:'linear'}:{duration:0}}/>
    <span>{label}</span>
  </div>;
}
