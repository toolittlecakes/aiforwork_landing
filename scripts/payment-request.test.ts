import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../assets/payment-request.js", import.meta.url), "utf8");
const id = "b7be6a2b-b8c3-4d2b-8f8b-a0ff0ec453e9";
const checkout = { checkoutId: id, orderId: id, status: "payment_link_created", paymentUrl: "https://merch.securepaytb.ru/order/?uuid=test" };
type Event = { name: string; context: Record<string, unknown> };
type PaymentResult = { data: Record<string, unknown>; requestId: string };
type PaymentRequest = (kind: "checkout" | "promo", body: unknown, slow?: () => void) => Promise<PaymentResult>;

function browser(fetchImpl: (url: string, init: RequestInit) => Promise<Response>) {
  const events: Event[] = [];
  const timers = new Map<number, { fn: () => void; delay: number }>();
  let timerId = 0;
  let elapsed = 0;
  const window: { paymentRequest?: PaymentRequest; dispatchEvent: (event: CustomEvent) => void } = {
    dispatchEvent: (event) => { const { event: name, ...context } = event.detail; events.push({ name, context }); },
  };
  runInNewContext(source, {
    window, URL, Error, SyntaxError, AbortController, CustomEvent,
    crypto: { randomUUID: () => id }, performance: { now: () => elapsed }, fetch: fetchImpl,
    setTimeout(fn: () => void, delay: number) { timers.set(++timerId, { fn, delay }); return timerId; },
    clearTimeout(timer: number) { timers.delete(timer); },
  });
  if (!window.paymentRequest) throw new Error("payment request script did not initialize");
  return {
    request: window.paymentRequest, events, timers,
    advance(delay: number) {
      elapsed = delay;
      for (const [key, timer] of [...timers]) {
        if (timer.delay <= delay) { timers.delete(key); timer.fn(); }
      }
    },
  };
}

test("slow checkout is visible and times out with one request, preserving its diagnostic ID", async () => {
  let calls = 0;
  let slow = false;
  const b = browser(async (_url, init) => {
    calls++;
    expect(new Headers(init.headers).get("X-Request-ID")).toBe(id);
    return new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    });
  });
  const result = b.request("checkout", { customer: { email: "private@example.com" } }, () => { slow = true; });
  b.advance(3000);
  expect(slow).toBe(true);
  b.advance(20000);
  await expect(result).rejects.toMatchObject({ code: "client.timeout", requestId: id });
  expect(calls).toBe(1);
  expect(b.events.map(e => e.name)).toEqual(["request_started", "request_slow", "request_failed"]);
  expect(b.events.at(-1)?.context).toMatchObject({ code: "client.timeout", durationMs: 20000 });
  expect(JSON.stringify(b.events)).not.toContain("private@example.com");
  expect(b.timers.size).toBe(0);
});

test("fast success clears the waiting message timer and preserves the payment URL", async () => {
  const b = browser(async () => Response.json(checkout));
  let slow = false;
  const result = await b.request("checkout", {}, () => { slow = true; });
  b.advance(20000);
  expect(slow).toBe(false);
  expect(result).toEqual({ data: checkout, requestId: id });
  expect(b.events.map(e => e.name)).toEqual(["request_started", "request_succeeded"]);
});

test.each([
  [504, "provider.timeout"], [502, "provider.payment_link_failed"], [429, "request.rate_limited"], [422, "promo.invalid"],
])("HTTP %s returns its explicit error code", async (status, code) => {
  const b = browser(async () => Response.json({ error: { code } }, { status }));
  await expect(b.request("checkout", {})).rejects.toMatchObject({ code, status, requestId: id });
  expect(b.timers.size).toBe(0);
});

test("network failure is reported even if the backend never receives the request", async () => {
  const b = browser(async () => { throw new TypeError("Failed to fetch"); });
  await expect(b.request("checkout", {})).rejects.toMatchObject({ code: "network.error", requestId: id });
  expect(b.events.at(-1)?.context.code).toBe("network.error");
});

test("HTML error responses cannot leak their body into diagnostics", async () => {
  const b = browser(async () => new Response("<html>private proxy response</html>", { status: 502 }));
  await expect(b.request("checkout", {})).rejects.toMatchObject({ code: "response.invalid", status: 502 });
  expect(JSON.stringify(b.events)).not.toContain("private proxy response");
});

test("checkout and promo response contracts reject malformed successes", async () => {
  for (const data of [{}, { ...checkout, paymentUrl: "javascript:alert(1)" }]) {
    const b = browser(async () => Response.json(data));
    await expect(b.request("checkout", {})).rejects.toMatchObject({ code: "response.invalid" });
  }
  const b = browser(async () => Response.json({ amountMinor: "800000" }));
  await expect(b.request("promo", {})).rejects.toMatchObject({ code: "response.invalid" });
});

test("promo timeout is ten seconds", async () => {
  const b = browser(async (_url, init) => new Promise((_resolve, reject) => {
    init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
  }));
  const result = b.request("promo", { promoCode: "PRIVATE_CODE" });
  b.advance(10000);
  await expect(result).rejects.toMatchObject({ code: "client.timeout" });
  expect(JSON.stringify(b.events)).not.toContain("PRIVATE_CODE");
});
