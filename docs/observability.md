# Landing observability

OpenObserve pilot on `racknerd-2`, connected only to `https://aiforwork.courses/` and its `www` alias. Payment backend instrumentation and other projects are outside this pilot. The landing loads the vendored browser logs SDK and `assets/observability.js`; no application build or package manager is required.

## What is collected

- JavaScript exceptions and unhandled promise rejections after SDK initialization, including sanitized stack traces.
- Network errors detected by the SDK, without request or response bodies.
- `payment:diagnostic` stages: `request_started`, `request_slow`, `request_succeeded`, `request_failed`, `redirect_requested`, `checkout_failed`. Checkout/promo attempts carry the same UUID `request_id` sent to the payment service as `X-Request-ID`.
- One `page_loaded` event per initialization, to verify that ingestion works.

Common fields: `project=aiforwork`, `service=landing`, `environment=production`, `release`, random per-load `page_id`, `page_path`, `event`, `message`, `status`, `browser`. Payment fields: `request_id`, `operation`, `duration_ms`, `error_code`, `http_status`. OpenObserve flattens nested error and HTTP fields into `error_kind`, `error_stack`, `http_url`, `http_status_code`.

There is no replay, click tracking, console forwarding, form capture, or user identifier in this integration. `beforeSend` rebuilds each event from an allowlist, strips URL query strings/fragments and email addresses, and drops network response bodies. OpenObserve may also enrich records with IP/geolocation and user-agent information at ingestion. Redaction is not a general detector of arbitrary personal data embedded in exception messages; avoid putting such data in errors.

The stream is `_rumlog` in organization `default`. `_timestamp` is ingestion time in microseconds; `date` is browser occurrence time in milliseconds. Batches can arrive later than the event. The VPS clock was approximately one minute ahead of the browser during setup, so the query helper computes its search window on the VPS. Use `date` when ordering a request's stages.

## Investigate through the API

From this repository, using the existing `racknerd-2` SSH alias:

```sh
bun scripts/query-observability.ts 'SELECT date, event, message, request_id, error_code, http_status, duration_ms FROM "_rumlog" WHERE service = '\''landing'\'' ORDER BY _timestamp DESC LIMIT 50' 24

bun scripts/query-observability.ts 'SELECT date, event, error_code, http_status, duration_ms, page_id FROM "_rumlog" WHERE request_id = '\''REPLACE_WITH_UUID'\'' ORDER BY date ASC' 24

bun scripts/query-observability.ts 'SELECT event, error_code, count(*) AS occurrences FROM "_rumlog" WHERE status = '\''error'\'' GROUP BY event, error_code ORDER BY occurrences DESC' 168
```

The helper POSTs SQL to `http://127.0.0.1:5080/api/default/_search?type=logs` on the VPS. Credentials are read there from `~/apps/openobserve/.env`; they are not copied to the workstation. The time range defaults to 24 hours, maximum 168 hours. Response size is limited to 200 rows; use aggregation or a narrower window for larger investigations and check `is_partial` before drawing conclusions. The administrative API/UI are not publicly exposed.

`request_id` joins browser diagnostics to payment-service logs and `orders.metadata.paymentAttemptId`. A browser-only `network.error` can exist without a corresponding backend request. A missing success event does not prove payment failure: the browser can close, lose connectivity, or block the collector. Server-confirmed payments remain the conversion source of truth.

## Deployment and operation

- Server: `~/apps/openobserve/compose.yml`, tracked source `infra/openobserve/compose.yml`.
- OpenObserve OSS: `public.ecr.aws/zinclabs/openobserve:v1.1.2`; local disk storage in `~/apps/openobserve/data` mounted at `/data`.
- Limits: 768 MiB RAM, no container swap, 0.5 CPU, 256 processes. Approximately 250–270 MiB RAM observed during pilot verification.
- Retention: 7 days, asynchronous compaction/deletion. This is not a disk quota. Docker logs rotate at 10 MB × 2. `RUST_LOG=warn` avoids routine access logs containing public ingestion tokens.
- Health: `ssh racknerd-2 'curl -fsS --max-time 10 http://127.0.0.1:5080/healthz'`.
- Resources: `ssh racknerd-2 'docker stats --no-stream openobserve-openobserve-1 && du -sh ~/apps/openobserve/data && df -h /'`.
- Update configuration: copy the tracked compose file to `~/apps/openobserve/compose.yml`, then run `docker compose up -d` from that directory. Never use `down -v` or delete the data directory to restart the service.

Root credentials are in the server-only `.env` (mode 600), using `ZO_ROOT_USER_EMAIL` and `ZO_ROOT_USER_PASSWORD`. The browser receives a public write-only RUM token through `GET https://pay.aiforwork.courses/telemetry/config.json`, fetched without cookies. Its file is `/var/lib/openobserve/public/config.json`; do not commit it. If rotating the token, regenerate this file from `GET /api/default/rumtoken`, whose response field is `data.rum_token`, and retain file readability for Caddy.

`/etc/caddy/Caddyfile` imports `/etc/caddy/openobserve.caddy` **before** the payment host block. That file is copied from `infra/openobserve/Caddyfile.fragment`. In `pay.aiforwork.courses`, use `import landing_telemetry` followed by `handle { reverse_proxy 127.0.0.1:8710 }`. Validate Caddy before reloading it. The pre-install backup is `~/apps/openobserve/Caddyfile.before-openobserve`.

Only configuration GET, logs POST and preflight OPTIONS are exposed, with exact landing Origin checks; other `/rum/*` and `/telemetry/*` paths return 403. Log bodies are limited to 256 KB. OpenObserve listens on loopback port 5080. Origin checks restrict browsers, but are not authentication against forged HTTP clients; the browser token is public by design and must never grant search/admin access.

The browser bundle is `@openobserve/browser-logs@0.4.3` from the official npm package, with Apache-2.0 license in `assets/vendor/openobserve-LICENSE.txt`. Only explicitly allowlisted assets enter `_site`; infrastructure, query scripts and credentials are not published. Landing deployment is the normal push-to-main workflow.

## Validation and limitations

```sh
bun test scripts/observability.test.ts scripts/payment-request.test.ts scripts/intro-experiment.test.ts
bash scripts/build-pages.sh
```

Verify in a real browser: SDK initialization, exception and rejected promise visible through SQL, checkout request correlation, 3-second slow notice, 20-second timeout recovery, duplicate-submit prevention, and successful navigation. Intercept checkout requests locally before submitting and stub `window.introExperiment` tracking methods; never create real orders or synthetic paid conversions. Also check that failed monitoring initialization leaves checkout functional. Read saved events again after a container restart.

Setup tests on 27 October 2026 used exception messages prefixed `OpenObserve ... smoke` and request IDs `31984b75-01bc-44c5-b2db-a416078e8316`, `0b087e6d-f7ab-4a22-a644-cf22e35f3eea`, `a9c31f60-4e66-406c-8e6d-d1f05dfe1755`, `03306c12-51c9-4ef2-b2a8-b283bf6712df`. These are synthetic browser diagnostics, not customer failures. The first long-duration timeout test used a manually released fake transport; use the later abort-aware test for the 20-second timeout assertion.

Production verification of commit `1061ff5` retained both a thrown exception and a rejected promise, with email/query redaction confirmed in the stored records. Request `3d495491-1a77-40f5-9c22-3f7a3f9f6ece` retained started → slow (3,076 ms) → timeout (20,077 ms), and the button became available again. Request `24f8642a-7c52-4267-b95a-67aa02fcd372` retained started → succeeded → redirect; the browser reached the stubbed destination. Exclude test `page_id` values `cc593cca-9f46-4923-b184-1f0038e5ab2f` and `3ea46d48-29f1-4443-a6dd-797d36246bdc` from customer incident counts during this retention window. All checkout requests in these browser tests were intercepted; no orders were created.

`window.landingObservability.status` is `loading`, `initialized`, or `unavailable`. Initialized means the SDK started, not that every batch was retained. Configuration failures produce an explicit console warning and do not block checkout. Events before initialization, offline events, blocked scripts/requests, or events during service downtime may be lost; there is no durable browser queue. The collector shares the payment VPS, so it cannot independently observe a full VPS outage. This pilot has local persistence but no separate backup/HA arrangement.
