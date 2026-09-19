# Icon and input expansion

216 namespaced SVG assets adapted from the supplied archive. The existing HydraMark
is unchanged. Repeated placeholders were replaced with semantic Lucide-derived
geometry in a warm folk-inspired tile treatment; technology icons are labeled
monograms, not claimed official logos. See packages/ui/THIRD_PARTY_NOTICES.
Original motifs are retained where meaningful. No raster backgrounds, remote SVGs,
runtime HTML injection, or new dependencies are introduced.

HydraIcon accepts a typed category/name and optional accessible label. It embeds
static data URLs: applications with CSP must allow `data:` in img-src, or serve the
standalone SVGs from their own origin. The dynamic catalog includes all icons;
use individual static SVGs where bundle size matters.

Additional controls: PasswordInput, RangeInput, FileInput, controlled RadioGroup,
and native Input types date, time, datetime-local, number, color, email, URL,
search and telephone. Native validation applies; selecting files does not upload
or validate file contents. These do not constitute every possible input: custom
combobox, date-range picker, tags and drag/drop remain separate future components.

AssetRelations is an accessible nested list with curved connectors and collapsible
branches, inspired by https://markmap.js.org/docs/markmap. Supply a finite tree with
unique node IDs. It is a hierarchy, not a general cyclic graph: shared infrastructure
and cross-links require a graph model. Example data is synthetic, not a live scan.

This iteration has type, component and build checks; visual browser QA is pending.
