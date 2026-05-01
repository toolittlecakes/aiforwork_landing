# Landing Workflow

## Source of Truth

- `index.md` is the content source of truth.
- `index.html` is the rendered landing page implementation and must be kept aligned with `index.md`.
- Some layout, visual hierarchy, responsive behavior, and interaction details live only in `index.html`. That is expected.
- Content decisions should be made in `index.md` first, then reflected in `index.html`.

## What Alignment Means

Alignment does not mean that `index.html` must be a literal markdown-to-HTML conversion.

Expected differences:

- Text can be split across spans, cards, columns, accordions, or emphasized fragments for design.
- Section labels, counters, decorative words, CSS classes, animation wrappers, and responsive markup can exist only in `index.html`.
- The same markdown paragraph can be represented as several visual blocks if the page design needs it.

Real mismatches that should be fixed:

- `index.md` has newer wording, but `index.html` still shows older copy.
- A section, FAQ item, CTA, list item, or segment was changed in `index.md` but not reflected on the page.
- `index.html` contains content that contradicts the current markdown source.
- Markdown removed a content block, but the old visible block still remains in HTML.

## Change Process

1. Update `index.md` for copy, structure, section wording, FAQ text, and content order.
2. Update `index.html` to match the markdown content while preserving the existing visual design and layout.
3. Compare the visible page copy against `index.md` before finishing. Check meaning and current wording, not exact DOM structure.
4. Keep diffs minimal: do not redesign or refactor unrelated parts while syncing copy.
5. Commit content-source changes and HTML-sync changes separately when the markdown was changed first.

## Deploy Process

- This is a static site. There is no build step.
- Deployment happens by pushing `main` to `origin`.
- The custom domain is configured through `CNAME`: `aiforwork.courses`.
- After pushing, verify the deployed page at `https://aiforwork.courses/`.
- GitHub Pages or CDN caching can delay visible updates briefly. Use a cache-busting query string if needed, for example `https://aiforwork.courses/?v=<commit>`.
