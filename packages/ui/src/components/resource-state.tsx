import { useHydraLocale } from "./locale";
import type {ReactNode} from 'react';
import {Alert} from './feedback';
import {Button} from './button';

export type ResourceStateProps =
  | {status:'loading';message?:string}
  | {status:'error';message:string;onRetry?:()=>void}
  | {status:'empty';message?:string;action?:ReactNode};

/** Shared async states. Never display raw server traces or credentials as messages. */
export function ResourceState(props:ResourceStateProps) {
  const { messages } = useHydraLocale();

  if(props.status==='loading')return <div role="status" aria-busy="true" className="rounded-hydra border border-hydra-line p-6">{props.message??messages.loadingData}</div>;
  if(props.status==='error')return <Alert tone="danger" title={messages.loadError}><p>{props.message}</p>{props.onRetry&&<Button className="mt-3" onClick={props.onRetry}>{messages.retry}</Button>}</Alert>;
  return <div role="status" className="rounded-hydra border border-dashed border-hydra-line p-6"><p>{props.message??messages.noData}</p>{props.action}</div>;
}
