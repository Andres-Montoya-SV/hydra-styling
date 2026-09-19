import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Badge } from "./badge";
import {HydraIcon, type HydraIconName} from './extended';

export type DocumentKind = "report" | "pdf" | "csv" | "json" | "image" | "archive" | "code" | "generic";

const kindLabels: Record<DocumentKind, string> = {
  report: "Report", pdf: "PDF", csv: "CSV", json: "JSON", image: "Image", archive: "Archive", code: "Code", generic: "File",
};

export interface DocumentCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  kind?: DocumentKind;
  meta?: string;
  action?: ReactNode;
}

export function DocumentCard({ name, kind = "generic", meta, action, className, ...props }: DocumentCardProps) {
  return (
    <div className={cn("group flex items-center gap-3 rounded-hydra border border-hydra-line bg-hydra-surface p-3 transition hover:border-hydra-accent/60 hover:bg-hydra-surface-strong", className)} {...props}>
      <div className="hydra-file-icon grid size-11 shrink-0 place-items-center rounded-hydra-sm border border-hydra-line bg-hydra-canvas text-xs font-black text-hydra-accent" aria-hidden="true">
        <HydraIcon name={('09-files-documents/'+({report:'file',pdf:'pdf',csv:'csv',json:'json',image:'image',archive:'zip',code:'txt',generic:'file'}[kind])) as HydraIconName} className="size-9"/>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-hydra-text">{name}</p>
        <div className="mt-1 flex items-center gap-2">
          <Badge className="px-1.5 py-0 text-[0.58rem]">{kindLabels[kind]}</Badge>
          {meta && <span className="truncate text-xs text-hydra-muted">{meta}</span>}
        </div>
      </div>
      {action}
    </div>
  );
}
