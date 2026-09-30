import {
  AssetMap,
  layoutAssetGraph,
  type MapAsset,
  type MapRelation,
} from "@hydra-security/ui";

// Reserved example domains and TEST-NET addresses: a visual fixture, not scan output.
const raw: MapAsset[] = [
  {
    id: "root",
    label: "example.com",
    kind: "domain",
    x: 500,
    y: 260,
    detail: "Primary scope · demonstration data",
  },
];
const edges: MapRelation[] = [];
const groups = ["api", "edge", "mail", "cloud", "staging", "identity"];
for (const [g, name] of groups.entries()) {
  const hub = `hub-${g}`;
  raw.push({
    id: hub,
    label: `${name}.example.com`,
    kind: "subdomain",
    x: 500,
    y: 260,
    detail: "Discovered subdomain · demonstration data",
  });
  edges.push({ source: "root", target: hub, label: "has subdomain" });
  for (let i = 0; i < 15; i++) {
    const id = `${name}-${i}`;
    const kind =
      i === 14 && g < 4
        ? "vulnerability"
        : i % 3 === 0
          ? "service"
          : i % 3 === 1
            ? "ip"
            : "subdomain";
    const label =
      kind === "ip"
        ? `192.0.2.${g * 16 + i + 1}`
        : kind === "service"
          ? `HTTPS · ${name}-${i}`
          : kind === "vulnerability"
            ? "TLS configuration review"
            : `${name}-${i}.example.com`;
    raw.push({
      id,
      label,
      kind,
      x: 500,
      y: 260,
      detail:
        "Sample asset for exploring relationships; no live scan is running.",
    });
    edges.push({
      source: hub,
      target: id,
      label:
        kind === "ip"
          ? "resolves to"
          : kind === "service"
            ? "exposes"
            : kind === "vulnerability"
              ? "requires review"
              : "related hostname",
    });
    if (i % 5 === 0 && i > 0)
      edges.push({
        source: `${name}-${i - 1}`,
        target: id,
        label: "observed with",
      });
  }
}
edges.push(
  { source: "api-1", target: "edge-1", label: "shared infrastructure" },
  { source: "cloud-3", target: "identity-3", label: "shared service" },
);
const nodes = layoutAssetGraph(raw, edges);
export const demoMetrics = {
  subdomains: nodes.filter((n) => n.kind === "subdomain").length,
  hosts: nodes.filter((n) => n.kind === "ip").length,
  ports: nodes.filter((n) => n.kind === "service").length,
  findings: nodes.filter((n) => n.kind === "vulnerability").length,
};
export default function MapDemo() {
  return (
    <AssetMap
      nodes={nodes}
      edges={edges}
      storageKey="hydra:demo:vitral-map:v2"
      decorative
    />
  );
}
