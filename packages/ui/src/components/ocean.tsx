import { useHydraLocale } from "./locale";
import {useHydraMotion} from './motion';

import {VitralBackground} from './vitral';

/** @deprecated Use VitralBackground. Kept as a visual-compatible migration alias. */
export function OceanBackground() { return <VitralBackground/>; }

export function SiteLoader({label}:{label?:string}) {
  const { messages } = useHydraLocale();
  if (label === undefined) label = messages.loadingHydra;

  const active=useHydraMotion();
  return <div className="hydra-loader" role="status" aria-live="polite">
    <span aria-hidden="true" className="hydra-loader-ring" data-active={active}/>
    <span>{label}</span>
  </div>;
}
