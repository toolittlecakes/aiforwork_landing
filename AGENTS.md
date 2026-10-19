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

- This is a static site. There is no application build toolchain; `scripts/build-pages.sh` only assembles the public artifact.
- Deployment happens by pushing `main` to `origin`.
- GitHub Actions builds the public artifact with `scripts/build-pages.sh` and syncs it to the `aiforwork.courses` and `www.aiforwork.courses` buckets in Yandex Object Storage.
- The custom domain `aiforwork.courses` points to the bucket through Namecheap DNS. HTTPS is provided by Yandex Certificate Manager.
- After pushing, verify the deployed page at `https://aiforwork.courses/`.
- DNS and browser caching can delay visible updates briefly. Use a cache-busting query string if needed, for example `https://aiforwork.courses/?v=<commit>`.

## Introduction Video Asset

- The `#intro` section follows `#authors`. Its public files are explicitly allowlisted in `scripts/build-pages.sh` under `assets/intro/`; other MP4s remain excluded from the public artifact.
- Video and poster filenames contain the first 12 hex characters of their SHA-256. Deployment gives these files `Cache-Control: public, max-age=31536000, immutable`; changed bytes require a new filename and updated HTML, markdown, and build paths.
- Serve H.264/AAC MP4 with `faststart` (the `moov` box before `mdat`), a lightweight WebP poster, native controls, `playsinline`, and `preload="none"`. Verify HTTP byte ranges, playback, and seeking after deployment.
- The current source was received via Telegram (message 627) and is retained locally in ignored `tmp/intro-video/source.mp4`. The 217-second source has fixed black bars: crop `1280:360:0:180`, encode with `libx264 -preset slow -crf 25 -maxrate 1200k -bufsize 2400k -pix_fmt yuv420p -g 60 -c:a aac -b:a 80k -movflags +faststart -map_metadata -1`. Keep source media outside the public artifact.

## Introduction Video Experiment

- Varioqub experiment `77148`, flag `intro_video_v1`, Metrica counter `108774715`: 50/50 `with_video` / `without_video`, 19 October–17 November 2026. Protocol and report links: `docs/intro-video-test.md`.
- `assets/intro-experiment.js` controls the entire `#intro` section and attaches experiment, variant, and Metrica ClientID to checkout metadata. No flag means outside the experiment, never the control group.
- Primary outcome is server-confirmed payment, imported manually at least weekly with `scripts/export-experiment-payments.ts`; preserve its ignored local upload ledger. Checkout creation is only the secondary goal. Do not infer payment from a browser redirect or run synthetic paid conversions in production.
- The first payment-form opening per page load sends `aiforwork_payment_opened` (goal `672510110`). Assigned visits also send the `intro_video_v1` visit parameter, so click conversion is compared in Metrica's visit-parameters report. This diagnostic goal is separate from Varioqub's two configured metrics.
- Run `bun test scripts/intro-experiment.test.ts` and the static build when changing experiment logic. Preserve the current treatment during the test; stop/restart under a new experiment ID for substantive changes.
