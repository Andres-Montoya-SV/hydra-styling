# Illustrated asset map

`AssetMap` renders typed `MapAsset[]` and `MapRelation[]` as an inline SVG graph.
The 1000 × 520 logical canvas uses supplied `x`/`y` coordinates; this is a curated
layout, not an automatic graph-layout engine. Keep labels and nodes spaced out.
Unique IDs and finite coordinates are required; dangling edges are ignored.

Domain and subdomain houses, IP globes, service racks and vulnerability triangles
are original code-native vector artwork. Decorative vegetation can be disabled
with `decorative={false}`. Colors and text identify type; risk detail belongs in
node `detail`. No arbitrary SVG/HTML injection or external asset fetches occur.

Zoom ranges from 75% to 250%. Drag background to pan; focus the canvas and use arrow
keys to pan or Home to reset. Fit resets to the documented logical canvas. Expand
enlarges in place and allows scrolling; it does not request browser fullscreen.
Nodes support Tab, Enter and Space. Selected relationships appear as text below.
Long labels are shortened visually but their full text remains in the accessible
name, SVG title and selection details. Callbacks expose selected domain data.

This scene intentionally uses a dark geographic surface in both application themes
to retain the supplied visual direction. It has no perpetual motion or hover-only
information. It is intended for small, curated graphs, not thousands of nodes;
large EASM inventories need clustering and layout/virtualization before use here.
The showcase has example data and makes no claim of live network discovery.
