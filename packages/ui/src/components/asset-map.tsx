import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  clampPosition,
  decodeLayout,
  mapPoint,
  relationPath,
  validateAssetGraph,
  type AssetLayout,
} from "../lib/asset-map";

export type AssetKind =
  | "domain"
  | "subdomain"
  | "ip"
  | "service"
  | "vulnerability";
export interface MapAsset {
  id: string;
  label: string;
  kind: AssetKind;
  x: number;
  y: number;
  detail?: string;
}
export interface MapRelation {
  source: string;
  target: string;
  label: string;
}
export interface AssetMapProps {
  nodes: MapAsset[];
  edges: MapRelation[];
  onSelect?: (node: MapAsset) => void;
  decorative?: boolean;
  storageKey?: string;
  onLayoutChange?: (positions: AssetLayout) => void;
}
const colors: Record<AssetKind, string> = {
  domain: "var(--hs-graph-domain)",
  subdomain: "var(--hs-graph-subdomain)",
  ip: "var(--hs-graph-ip)",
  service: "var(--hs-graph-service)",
  vulnerability: "var(--hs-graph-vulnerability)",
};

/** Coordinates use a 1000 x 520 canvas. A graph may include cross-links and cycles. */
export function AssetMap(props: AssetMapProps) {
  const errors = validateAssetGraph(props.nodes, props.edges);
  if (errors.length)
    return (
      <section className="hydra-map-detail" role="alert">
        <strong>Invalid asset data</strong>
        <ul>
          {errors.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      </section>
    );
  return <ValidatedAssetMap key={props.storageKey} {...props} />;
}

function ValidatedAssetMap({
  nodes: sourceNodes,
  edges,
  onSelect,
  decorative = false,
  storageKey,
  onLayoutChange,
}: AssetMapProps) {
  const uid = useId().replace(/:/g, "");
  const root = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<AssetLayout>([]);
  const draft = useRef<AssetLayout>([]);
  const [storageNotice, setStorageNotice] = useState("");
  const suppressClick = useRef(false);
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = decodeLayout(raw, sourceNodes);
        draft.current = saved;
        setPositions(saved);
      }
    } catch {
      setStorageNotice(
        "Saved positions could not be loaded. Original positions are shown.",
      );
    }
  }, [storageKey]);
  const overrides = new Map(positions.map((p) => [p.id, p]));
  const nodes = sourceNodes.map((n) => ({ ...n, ...overrides.get(n.id) }));
  function update(next: AssetLayout) {
    draft.current = next;
    setPositions(next);
  }
  function commit(next: AssetLayout) {
    const layout = sourceNodes.map(
      (n) => next.find((p) => p.id === n.id) ?? { id: n.id, x: n.x, y: n.y },
    );
    if (storageKey) {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ version: 1, positions: layout }),
        );
        setStorageNotice("Positions saved in this browser.");
      } catch {
        setStorageNotice("Positions could not be saved in this browser.");
      }
    }
    onLayoutChange?.(layout);
  }
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const drag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    px: number;
    py: number;
    node?: MapAsset;
    before: AssetLayout;
    panBefore: { x: number; y: number };
    moved: boolean;
  } | null>(null);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const current = selected ? byId.get(selected) : undefined;
  const validEdges = useMemo(() => {
    const lanes = new Map<string, number>();
    return edges.map((edge) => {
      const key = JSON.stringify([edge.source, edge.target].sort());
      const lane = lanes.get(key) ?? 0;
      lanes.set(key, lane + 1);
      return { ...edge, lane };
    });
  }, [edges]);
  const [query, setQuery] = useState("");
  const [showLabels, setShowLabels] = useState(false);
  const matches = new Set(
    nodes
      .filter((n) => n.label.toLowerCase().includes(query.toLowerCase().trim()))
      .map((n) => n.id),
  );
  const neighbours = new Set<string>(selected ? [selected] : []);
  if (selected)
    for (const e of edges) {
      if (e.source === selected) neighbours.add(e.target);
      if (e.target === selected) neighbours.add(e.source);
    }

  function choose(node: MapAsset) {
    setSelected(node.id);
    onSelect?.(node);
  }
  function fit() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }
  function finish(cancel = false) {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    suppressClick.current = active.moved || !!active.node;
    if (cancel) {
      update(active.before);
      setPan(active.panBefore);
    } else if (active.node) {
      if (active.moved) commit(draft.current);
      else choose(active.node);
    }
  }
  return (
    <section
      ref={root}
      className={`hydra-asset-map ${expanded ? "hydra-map-expanded" : ""}`}
      aria-label="Asset map"
    >
      <header className="hydra-map-header">
        <div>
          <h2>Asset Map</h2>
          <p>
            {nodes.length} assets · {edges.length} relationships
          </p>
        </div>
        <ul aria-label="Asset types">
          {Object.entries(colors).map(([kind, color]) => (
            <li key={kind}>
              <span style={{ background: color }} />
              {kind === "ip" ? "IP" : kind[0].toUpperCase() + kind.slice(1)}
            </li>
          ))}
        </ul>
      </header>
      <div className="hydra-map-toolbar" role="group" aria-label="Map controls">
        <label className="hydra-map-search">
          Find asset
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Domain, IP, service…"
          />
        </label>
        <button
          type="button"
          className="hydra-map-label-toggle"
          aria-pressed={showLabels}
          onClick={() => setShowLabels(!showLabels)}
        >
          Labels
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          disabled={zoom >= 2.5}
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          disabled={zoom <= 0.75}
          onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
        >
          −
        </button>
        <button type="button" aria-label="Fit map" onClick={fit}>
          ⤢
        </button>
        <button
          type="button"
          aria-label={expanded ? "Reduce map" : "Expand map"}
          aria-pressed={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "↙" : "↗"}
        </button>
        <output aria-label="Zoom level">{Math.round(zoom * 100)}%</output>
      </div>
      <div className="hydra-map-viewport">
        <svg
          viewBox={`${500 - 500 / zoom - pan.x} ${260 - 260 / zoom - pan.y} ${1000 / zoom} ${520 / zoom}`}
          role="group"
          aria-label="Interactive asset relationships"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            const delta = {
              ArrowLeft: [30, 0],
              ArrowRight: [-30, 0],
              ArrowUp: [0, 30],
              ArrowDown: [0, -30],
            }[e.key];
            if (delta) {
              e.preventDefault();
              setPan((p) => ({ x: p.x + delta[0], y: p.y + delta[1] }));
            }
            if (e.key === "Home") {
              e.preventDefault();
              fit();
            }
            if (e.key === "Escape") {
              finish(true);
              setExpanded(false);
            }
          }}
          onPointerDown={(e) => {
            if (e.button !== 0 || drag.current) return;
            const point = mapPoint(
              e.clientX,
              e.clientY,
              e.currentTarget.getBoundingClientRect(),
              zoom,
              pan,
            );
            if (!point) return;
            const id = (e.target as Element)
              .closest("[data-asset]")
              ?.getAttribute("data-asset");
            const node = id ? byId.get(id) : undefined;
            suppressClick.current = false;
            drag.current = {
              pointerId: e.pointerId,
              x: e.clientX,
              y: e.clientY,
              px: point.x,
              py: point.y,
              node,
              before: draft.current,
              panBefore: pan,
              moved: false,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const active = drag.current;
            if (!active || active.pointerId !== e.pointerId) return;
            if (
              Math.hypot(e.clientX - active.x, e.clientY - active.y) < 3 &&
              !active.moved
            )
              return;
            const point = mapPoint(
              e.clientX,
              e.clientY,
              e.currentTarget.getBoundingClientRect(),
              zoom,
              active.panBefore,
            );
            if (!point) return;
            active.moved = true;
            const dx = point.x - active.px,
              dy = point.y - active.py;
            if (active.node) {
              const p = clampPosition(
                active.node,
                active.node.x + dx,
                active.node.y + dy,
              );
              update([...draft.current.filter((n) => n.id !== p.id), p]);
            } else
              setPan({
                x: active.panBefore.x + dx,
                y: active.panBefore.y + dy,
              });
          }}
          onPointerUp={(e) => {
            if (drag.current?.pointerId !== e.pointerId) return;
            finish();
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onPointerCancel={(e) => {
            if (drag.current?.pointerId === e.pointerId) finish(true);
          }}
          onLostPointerCapture={() => finish(true)}
        >
          <defs>
            <radialGradient id={`${uid}-sky`}>
              <stop stopColor="var(--hs-surface)" />
              <stop offset="1" stopColor="var(--hs-canvas)" />
            </radialGradient>
            <pattern
              id={`${uid}-grid`}
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="1"
                cy="1"
                r=".65"
                fill="var(--hs-line)"
                opacity=".5"
              />
            </pattern>
            {Object.entries(colors).map(([kind, color]) => (
              <marker
                key={kind}
                id={`${uid}-${kind}-arrow`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0 0 10 5 0 10Z" fill={color} />
              </marker>
            ))}
          </defs>
          <rect
            x="-3000"
            y="-3000"
            width="7000"
            height="7000"
            fill={`url(#${uid}-sky)`}
          />
          {decorative && (
            <rect
              x="-3000"
              y="-3000"
              width="7000"
              height="7000"
              fill={`url(#${uid}-grid)`}
              aria-hidden="true"
              pointerEvents="none"
            />
          )}
          <g aria-hidden="true" pointerEvents="none">
            {validEdges.map((edge) => {
              const a = byId.get(edge.source)!,
                b = byId.get(edge.target)!;
              const connected = selected === a.id || selected === b.id;
              return (
                <path
                  key={JSON.stringify([edge.source, edge.target, edge.label])}
                  className="hydra-graph-edge"
                  data-relationship={`${edge.source}:${edge.target}`}
                  d={relationPath(a, b, edge.lane)}
                  fill="none"
                  stroke={connected ? colors[b.kind] : "var(--hs-graph-edge)"}
                  opacity={
                    selected && !connected ? 0.2 : connected ? 0.95 : 0.8
                  }
                  strokeWidth={connected ? 1.5 : 0.8}
                  markerEnd={
                    connected ? `url(#${uid}-${b.kind}-arrow)` : undefined
                  }
                />
              );
            })}
          </g>
          {nodes.map((node) => (
            <g
              data-asset={node.id}
              key={node.id}
              transform={`translate(${node.x} ${node.y})`}
              role="button"
              tabIndex={0}
              aria-label={`${node.label}, ${node.kind}`}
              aria-pressed={selected === node.id}
              onClick={() => {
                if (!suppressClick.current) choose(node);
              }}
              aria-description="Drag to move. Arrow keys move by 10 units; Shift moves by 1. Items cannot be deleted."
              onKeyDown={(e) => {
                const delta = {
                  ArrowLeft: [-1, 0],
                  ArrowRight: [1, 0],
                  ArrowUp: [0, -1],
                  ArrowDown: [0, 1],
                }[e.key];
                if (delta) {
                  e.preventDefault();
                  e.stopPropagation();
                  const step = e.shiftKey ? 1 : 10;
                  const p = clampPosition(
                    node,
                    node.x + delta[0] * step,
                    node.y + delta[1] * step,
                  );
                  const next = [
                    ...draft.current.filter((n) => n.id !== node.id),
                    p,
                  ];
                  update(next);
                  commit(next);
                }
                if (e.key === "Escape") {
                  finish(true);
                }
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  choose(node);
                }
              }}
              className="hydra-map-node"
            >
              <title>{node.label + " — " + node.kind}</title>
              <circle r="15" fill="transparent" />
              <circle
                className="hydra-node-glow"
                r={node.kind === "domain" ? 22 : 9}
                fill={colors[node.kind]}
              />
              <circle
                className="hydra-node-ring"
                r={node.kind === "domain" ? 15 : 10}
              />
              <circle
                className="hydra-node-dot"
                r={
                  node.kind === "domain"
                    ? 7
                    : node.kind === "subdomain"
                      ? 4.5
                      : 3.2
                }
                fill={colors[node.kind]}
                stroke="var(--hs-canvas)"
                strokeWidth="1"
                opacity={
                  (query && !matches.has(node.id)) ||
                  (selected && !neighbours.has(node.id))
                    ? 0.2
                    : 1
                }
              />
              {node.kind === "vulnerability" && (
                <text
                  y="-9"
                  textAnchor="middle"
                  fill={colors[node.kind]}
                  fontSize="11"
                  fontWeight="bold"
                  aria-hidden="true"
                >
                  !
                </text>
              )}
              <text
                className={`hydra-node-label ${showLabels || node.kind === "domain" || selected === node.id || (query && matches.has(node.id)) ? "" : "hydra-node-label-secondary"}`}
                y={node.kind === "domain" ? 26 : 20}
                textAnchor="middle"
              >
                {node.label.length > 32
                  ? node.label.slice(0, 29) + "…"
                  : node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="hydra-map-detail" aria-live="polite">
        {current ? (
          <>
            <strong>{current.label}</strong>
            <span>
              {current.kind} · {current.detail ?? "Selected asset"}
            </span>
            <ul>
              {validEdges
                .filter(
                  (e) => e.source === current.id || e.target === current.id,
                )
                .map((e, i) => (
                  <li key={i}>
                    {byId.get(e.source)!.label} → {e.label} →{" "}
                    {byId.get(e.target)!.label}
                  </li>
                ))}
            </ul>
            <button type="button" onClick={() => setSelected(null)}>
              Clear selection
            </button>
          </>
        ) : (
          <span>
            Select an asset to inspect its relationships. Drag the canvas to
            pan; use arrow keys when the map is focused. Home resets the view.
          </span>
        )}
      </div>
      <p className="hydra-map-help">
        Drag assets to move them; arrow keys move a focused asset, Shift moves
        precisely. Assets cannot be deleted.{" "}
        {storageKey
          ? "Positions are stored in this browser."
          : "Positions last for this session."}
      </p>
      {storageNotice && (
        <p
          className="hydra-map-detail"
          role="status"
          aria-label="Layout storage"
        >
          {storageNotice}
        </p>
      )}
      {query && (
        <p
          className="hydra-map-detail"
          role="status"
          aria-label="Search results"
        >
          {matches.size} matching assets. Non-matching assets stay in the graph.
        </p>
      )}
      {!nodes.length && (
        <p className="hydra-map-detail">No assets to display.</p>
      )}
    </section>
  );
}
