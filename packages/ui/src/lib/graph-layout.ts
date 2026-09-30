import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from "d3-force";
import { validateAssetGraph } from "./asset-map";
import type { MapAsset, MapRelation } from "../components/asset-map";

/** Deterministic, bounded, static force layout. Copies inputs; never runs an animation timer.
 * Compute once when topology changes. For large datasets call in a worker before rendering.
 */
export function layoutAssetGraph(
  nodes: MapAsset[],
  edges: MapRelation[],
): MapAsset[] {
  const errors = validateAssetGraph(nodes, edges);
  if (errors.length) throw new Error(errors.join(" "));
  if (!nodes.length) return [];
  type Particle = SimulationNodeDatum & { id: string; kind: MapAsset["kind"] };
  const particles: Particle[] = nodes.map((n) => ({ id: n.id, kind: n.kind }));
  const simulation = forceSimulation(particles)
    .stop()
    .force(
      "link",
      forceLink<Particle, { source: string; target: string }>(
        edges.map((e) => ({ source: e.source, target: e.target })),
      )
        .id((n) => n.id)
        .distance((link) =>
          (link.source as unknown as Particle).kind === "domain" ? 95 : 30,
        )
        .strength(0.8),
    )
    .force("charge", forceManyBody().strength(-70))
    .force(
      "collide",
      forceCollide<Particle>().radius((n) => (n.kind === "domain" ? 20 : 7)),
    )
    .force("x", forceX(0).strength(0.035))
    .force("y", forceY(0).strength(0.06));
  simulation.tick(180);
  const xs = particles.map((n) => n.x!),
    ys = particles.map((n) => n.y!);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const scale = Math.min(
    800 / Math.max(1, maxX - minX),
    360 / Math.max(1, maxY - minY),
  );
  return nodes.map((n, i) => ({
    ...n,
    x: 500 + (xs[i] - (minX + maxX) / 2) * scale,
    y: 280 + (ys[i] - (minY + maxY) / 2) * scale,
  }));
}
