import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../assets/observability.js", import.meta.url), "utf8");
const requestId = "b7be6a2b-b8c3-4d2b-8f8b-a0ff0ec453e9";
type Log = Record<string, unknown>;
type Config = { beforeSend: (log: Log) => boolean; [key: string]: unknown };

async function browser(fetchImpl = async (_url: string, _init: RequestInit) => Response.json({ clientToken: "public-browser-test-token" })) {
  const listeners = new Map<string, (event: { detail: unknown }) => void>();
  const logs: Log[] = [];
  const buffered: Log[] = [];
  const warnings: string[] = [];
  let finish: () => void = () => { throw new Error("readiness promise not initialized"); };
  const ready = new Promise<void>((resolve) => { finish = resolve; });
  let config: Config | undefined;
  const emit = (status: string) => (message: string, context: Log) => {
    const log = { date: 1000, status, origin: "logger", message, ...context };
    if (!config) buffered.push(log);
    else if (config.beforeSend(log)) logs.push(log);
    if (message === "landing.page_loaded") finish();
  };
  const window = {
    landingObservability: { status: "" },
    addEventListener: (name: string, handler: (event: { detail: unknown }) => void) => listeners.set(name, handler),
    O2_LOGS: {
      init(value: Config) { config = value; for (const log of buffered) if (config.beforeSend(log)) logs.push(log); },
      logger: { info: emit("info"), warn: emit("warn"), error: emit("error") },
    },
  };
  runInNewContext(source, {
    window, URL, AbortController, setTimeout, clearTimeout,
    location: { origin: "https://aiforwork.courses", pathname: "/", href: "https://aiforwork.courses/?email=private@example.com" },
    navigator: { userAgent: "test-browser" }, crypto: { randomUUID: () => requestId },
    fetch: fetchImpl, console: { warn: (message: string) => { warnings.push(message); finish(); } },
  });
  await ready;
  return {
    logs, warnings, window, config,
    payment(detail: unknown) { listeners.get("payment:diagnostic")?.({ detail }); },
    incoming(log: Log) { if (!config) throw new Error("not initialized"); config.beforeSend(log); return log; },
  };
}

test("payment stages retain correlation and outcome without form fields", async () => {
  const b = await browser();
  b.payment({ event: "request_failed", requestId, operation: "checkout", durationMs: 15000, code: "provider.timeout", status: 504, email: "private@example.com", body: "private form" });
  expect(b.window.landingObservability.status).toBe("initialized");
  expect(b.logs.at(-1)).toMatchObject({ event: "request_failed", request_id: requestId, duration_ms: 15000, error_code: "provider.timeout", http_status: 504, status: "error", project: "aiforwork" });
  expect(JSON.stringify(b.logs)).not.toContain("private");
  expect(b.config).toMatchObject({ forwardConsoleLogs: [], forwardReports: [], telemetrySampleRate: 0 });
});

test("network errors never retain response bodies, URL secrets, user or arbitrary context", async () => {
  const b = await browser();
  const log = b.incoming({ date: 1000, origin: "network", status: "error", message: "Fetch /?token=secret", http: { url: "https://pay.aiforwork.courses/v1/checkouts?token=secret", status_code: 500 }, error: { stack: '{"customer":"private@example.com","password":"secret"}' }, usr: { email: "private@example.com" }, view: { url: "https://aiforwork.courses/?private", referrer: "https://private.example" }, context: { name: "private" } });
  expect(log).toMatchObject({ event: "network_error", http: { url: "https://pay.aiforwork.courses/v1/checkouts", status_code: 500 }, view: { url: "https://aiforwork.courses/" } });
  expect(log.error).toBeUndefined();
  expect(JSON.stringify(log)).not.toMatch(/private|secret/);
});

test("uncaught error keeps stack location while stripping emails and query strings", async () => {
  const b = await browser();
  const log = b.incoming({ origin: "source", status: "error", message: "failed private@example.com", error: { kind: "TypeError", stack: "TypeError: failed private@example.com\n at https://aiforwork.courses/assets/app.js?token=secret:10:2", causes: [{ message: "private" }] } });
  expect(log.error).toMatchObject({ kind: "TypeError" });
  expect(JSON.stringify(log)).toContain("/assets/app.js");
  expect(JSON.stringify(log)).not.toMatch(/private|secret/);
});

test("untrusted custom diagnostics cannot inject fields or arbitrary messages", async () => {
  const b = await browser();
  b.payment({ event: "unknown", body: "private" });
  expect(b.logs.length).toBe(1);
  b.payment({ event: "request_failed", requestId: "private", operation: "private", code: "private", durationMs: -1, status: 999 });
  expect(JSON.stringify(b.logs)).not.toContain("private");
  expect(b.logs.at(-1)?.duration_ms).toBeUndefined();
});

test("unavailable monitoring configuration is explicit and does not touch payment transport", async () => {
  const b = await browser(async () => { throw new TypeError("offline"); });
  expect(b.window.landingObservability.status).toBe("unavailable");
  expect(b.config).toBeUndefined();
  expect(b.warnings.length).toBe(1);
  expect("paymentRequest" in b.window).toBe(false);
});

test("invalid configuration is rejected before initializing the SDK", async () => {
  const b = await browser(async () => Response.json({ clientToken: null }));
  expect(b.window.landingObservability.status).toBe("unavailable");
  expect(b.config).toBeUndefined();
});

test("URL promo check starts only after the deferred diagnostics listener exists", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  expect(html.includes('<script defer src="/assets/observability.js')).toBe(true);
  expect(html.includes('document.addEventListener("DOMContentLoaded", applyPromoFromUrl);')).toBe(true);
  expect(html.includes("void applyPromoFromUrl()")).toBe(false);
});
