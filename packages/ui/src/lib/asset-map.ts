import type { MapAsset } from "../components/asset-map";

export interface AssetPosition {
  id: string;
  x: number;
  y: number;
}
export type AssetLayout = AssetPosition[];
export const assetKinds = [
  "domain",
  "subdomain",
  "ip",
  "service",
  "vulnerability",
] as const;
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 512): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
const coordinate = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1e6;

/** Validate untrusted API data before rendering. Labels are plain text, never HTML. */
export function validateAssetGraph(nodes: unknown, edges: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(nodes) || !Array.isArray(edges))
    return ["Nodes and edges must be arrays."];
  if (nodes.length > 1000 || edges.length > 5000)
    return ["Graph exceeds the limit of 1000 assets or 5000 relationships."];
  const ids = new Set<string>();
  nodes.forEach((n, i) => {
    if (!record(n)) {
      errors.push(`Asset ${i + 1} must be an object.`);
      return;
    }
    if (!text(n.id, 128)) errors.push(`Asset ${i + 1} has an invalid ID.`);
    else {
      if (ids.has(n.id)) errors.push(`Duplicate asset ID: ${n.id}.`);
      ids.add(n.id);
    }
    if (!text(n.label))
      errors.push(`Asset ${i + 1} needs a label (1–512 characters).`);
    if (!assetKinds.includes(n.kind as MapAsset["kind"]))
      errors.push(`Asset ${i + 1} has an unknown kind.`);
    if (!coordinate(n.x) || !coordinate(n.y))
      errors.push(`Asset ${i + 1} has invalid coordinates.`);
    if (
      n.detail !== undefined &&
      (typeof n.detail !== "string" || n.detail.length > 4000)
    )
      errors.push(`Asset ${i + 1} has invalid detail.`);
  });
  const relations = new Set<string>();
  edges.forEach((e, i) => {
    if (!record(e)) {
      errors.push(`Relationship ${i + 1} must be an object.`);
      return;
    }
    if (
      !text(e.source, 128) ||
      !text(e.target, 128) ||
      !ids.has(e.source) ||
      !ids.has(e.target)
    )
      errors.push(`Relationship ${i + 1} references an unknown asset.`);
    if (!text(e.label)) errors.push(`Relationship ${i + 1} needs a label.`);
    const key = JSON.stringify([e.source, e.target, e.label]);
    if (relations.has(key)) errors.push(`Relationship ${i + 1} is duplicated.`);
    relations.add(key);
  });
  return errors.slice(0, 100);
}

export function clampPosition(
  node: Pick<MapAsset, "id" | "kind">,
  x: number,
  y: number,
): AssetPosition {
  return {
    id: node.id,
    x: Math.max(92, Math.min(908, x)),
    y: Math.max(node.kind === "domain" ? 100 : 56, Math.min(480, y)),
  };
}

/** SVG uses xMidYMid meet; subtract letterboxing before converting screen points. */
export function mapPoint(
  clientX: number,
  clientY: number,
  box: { left: number; top: number; width: number; height: number },
  zoom: number,
  pan: { x: number; y: number },
) {
  const scale = Math.min(box.width / 1000, box.height / 520) * zoom;
  if (!Number.isFinite(scale) || scale <= 0) return null;
  return {
    x: 500 - pan.x + (clientX - box.left - box.width / 2) / scale,
    y: 260 - pan.y + (clientY - box.top - box.height / 2) / scale,
  };
}

export function decodeLayout(raw: string, nodes: MapAsset[]): AssetLayout {
  if (raw.length > 250000) throw new Error("Saved layout is too large.");
  const value: unknown = JSON.parse(raw);
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.positions) ||
    value.positions.length > 1000
  )
    throw new Error("Invalid saved layout.");
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const seen = new Set<string>();
  const result: AssetLayout = [];
  for (const p of value.positions) {
    if (
      !record(p) ||
      !text(p.id, 128) ||
      seen.has(p.id) ||
      !coordinate(p.x) ||
      !coordinate(p.y)
    )
      throw new Error("Invalid saved position.");
    seen.add(p.id);
    const node = byId.get(p.id);
    if (node) result.push(clampPosition(node, p.x, p.y));
  }
  return result;
}

/** Edge endpoints attach to circular node boundaries, including parallel/reverse links. */
export function relationPath(a: MapAsset, b: MapAsset, lane = 0): string {
  const radius = (n: MapAsset) =>
    n.kind === "domain" ? 8 : n.kind === "subdomain" ? 5.5 : 4.2;
  const dx = b.x - a.x,
    dy = b.y - a.y,
    distance = Math.hypot(dx, dy);
  const ar = radius(a),
    br = radius(b);
  if (a.id === b.id || distance < ar + br) {
    const reach = 26 + lane * 10;
    return `M ${a.x - ar} ${a.y} C ${a.x - reach} ${a.y - reach * 2}, ${b.x + reach} ${b.y - reach * 2}, ${b.x + br} ${b.y}`;
  }
  const ux = dx / distance,
    uy = dy / distance;
  const p = { x: a.x + ux * ar, y: a.y + uy * ar },
    q = { x: b.x - ux * br, y: b.y - uy * br };
  if (!lane) return `M ${p.x} ${p.y} L ${q.x} ${q.y}`;
  const bend = lane * 16;
  return `M ${p.x} ${p.y} Q ${(p.x + q.x) / 2 - uy * bend} ${(p.y + q.y) / 2 + ux * bend}, ${q.x} ${q.y}`;
}
