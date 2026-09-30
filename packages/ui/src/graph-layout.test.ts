import { expect, it } from "vitest";
import { layoutAssetGraph } from "./lib/graph-layout";
import type { MapAsset } from "./components/asset-map";
it("lays out cyclic/disconnected graphs deterministically without mutating source data", () => {
  const nodes: MapAsset[] = Array.from({ length: 40 }, (_, i) => ({
    id: String(i),
    label: `host-${i}`,
    kind: i === 0 ? "domain" : "ip",
    x: 500,
    y: 260,
  }));
  const edges = nodes
    .slice(1, 35)
    .map((n) => ({ source: "0", target: n.id, label: "resolves to" }));
  edges.push(
    { source: "1", target: "0", label: "reverse" },
    { source: "0", target: "0", label: "self" },
  );
  const before = JSON.stringify([nodes, edges]);
  const a = layoutAssetGraph(nodes, edges),
    b = layoutAssetGraph(nodes, edges);
  expect(a).toEqual(b);
  expect(JSON.stringify([nodes, edges])).toBe(before);
  expect(a).toHaveLength(nodes.length);
  expect(new Set(a.map((n) => `${n.x},${n.y}`)).size).toBe(nodes.length);
  for (const n of a) {
    expect(n.x).toBeGreaterThanOrEqual(99);
    expect(n.x).toBeLessThanOrEqual(901);
    expect(n.y).toBeGreaterThanOrEqual(99);
    expect(n.y).toBeLessThanOrEqual(461);
  }
});
it("handles empty and singleton graphs and rejects broken relationships", () => {
  expect(layoutAssetGraph([], [])).toEqual([]);
  const node: MapAsset = {
    id: "one",
    label: "example.com",
    kind: "domain",
    x: 0,
    y: 0,
  };
  expect(layoutAssetGraph([node], [])).toEqual([{ ...node, x: 500, y: 280 }]);
  expect(() =>
    layoutAssetGraph(
      [node],
      [{ source: "one", target: "missing", label: "bad" }],
    ),
  ).toThrow("unknown asset");
});
