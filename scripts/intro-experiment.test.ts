import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { conversionRows } from "./export-experiment-payments";

const source = readFileSync(new URL("../assets/intro-experiment.js", import.meta.url), "utf8");
function browser(clientId: string | null = "123456789") {
  const root = { dataset: {} as Record<string, string> };
  const timers: (() => void)[] = [];
  const calls: unknown[][] = [];
  const listeners: Record<string, () => void> = {};
  const sandbox: any = {
    document: { documentElement: root, head: { append() {} }, createElement: () => ({ addEventListener: (name: string, fn: () => void) => { listeners[name] = fn; } }) },
    console: { error() {} },
    setTimeout(fn: () => void) { timers.push(fn); return timers.length; },
    clearTimeout() {},
    ym(...args: any[]) {
      calls.push(args);
      if (args[1] === "getClientID" && clientId) args[2](clientId);
      if (args[1] === "reachGoal" && typeof args[4] === "function") args[4]();
    },
  };
  sandbox.window = sandbox;
  runInNewContext(source, sandbox);
  const callback = Array.from(sandbox.ymab.a).find((args: any) => args[1] === "init") as any;
  return { root, timers, calls, listeners, api: sandbox.introExperiment, assign: (flags: unknown) => callback[2]({ flags }) };
}

test.each(["with_video", "without_video"])("%s is attached to the checkout and its goal", async (variant) => {
  const b = browser();
  b.assign({ intro_video_v1: [variant] });
  expect(b.root.dataset.introExperiment).toBe(variant);
  expect(b.api.checkoutMetadata()).toEqual({ experiment: "intro_video_v1", variant, metrikaClientId: "123456789" });
  await b.api.checkoutCreated();
  expect(b.calls.filter((args) => args[1] === "reachGoal")).toHaveLength(1);
});

test("missing flag is outside the test, not control", () => {
  const b = browser(); b.assign({});
  expect(b.root.dataset.introExperiment).toBe("excluded");
  expect(b.api.checkoutMetadata()).toEqual({});
});

test.each(["with_video", "without_video"])("%s tracks the first payment form opening and exposes its visit segment", (variant) => {
  const b = browser();
  b.assign({ intro_video_v1: [variant] });
  expect(b.calls.find((args) => args[1] === "params")?.[2]).toEqual({ intro_video_v1: variant });
  b.api.paymentOpened();
  b.api.paymentOpened();
  expect(b.calls.filter((args) => args[2] === "aiforwork_payment_opened")).toHaveLength(1);
  expect(b.calls.filter((args) => args[2] === "aiforwork_checkout_created")).toHaveLength(0);
  expect(b.api.checkoutMetadata().variant).toBe(variant);
});

test("pending, excluded and failed assignments do not count payment clicks", () => {
  const pending = browser();
  pending.api.paymentOpened();
  const excluded = browser(); excluded.assign({}); excluded.api.paymentOpened();
  const failed = browser(); failed.listeners.error(); failed.api.paymentOpened();
  for (const b of [pending, excluded, failed]) {
    expect(b.calls.filter((args) => args[1] === "reachGoal")).toHaveLength(0);
  }
});

test("blocked analytics and invalid flags cannot create attributed conversions", async () => {
  for (const flags of [{ intro_video_v1: ["unknown"] }, { intro_video_v1: ["with_video", "without_video"] }]) {
    const b = browser(); b.assign(flags);
    expect(b.root.dataset.introExperiment).toBe("error");
    expect(b.api.checkoutMetadata()).toEqual({});
    await b.api.checkoutCreated();
    expect(b.calls.filter((args) => args[1] === "reachGoal")).toHaveLength(0);
  }
  const b = browser(null); b.assign({ intro_video_v1: ["with_video"] });
  expect(b.api.checkoutMetadata()).toEqual({});
});

test("timeout or checkout freezes participation before a late assignment", () => {
  for (const timeout of [true, false]) {
    const b = browser();
    if (timeout) b.timers[0](); else b.api.checkoutMetadata();
    b.assign({ intro_video_v1: ["without_video"] });
    expect(b.root.dataset.introExperiment).toBe("error");
    expect(b.api.checkoutMetadata()).toEqual({});
  }
});

const paid = { id: "order-1", projectId: "aiforwork", status: "paid", paidAt: "2026-10-19T12:00:00Z", amountMinor: 500000, currency: "RUB", metadata: { experiment: "intro_video_v1", variant: "with_video", metrikaClientId: "123456789" } };
test("export includes confirmed payments once, using the actual payment timestamp and rubles", () => {
  const rows = conversionRows([paid, { ...paid, id: "unpaid", status: "payment_link_created" }, { ...paid, id: "old", metadata: {} }, { ...paid, id: "refunded", status: "refunded" }], []);
  expect(rows).toEqual([{ orderId: "order-1", row: "123456789,aiforwork_order_paid,1792411200,5000.00,RUB" }]);
  expect(conversionRows([paid], ["order-1"])).toEqual([]);
  expect(() => conversionRows([{ ...paid, paidAt: undefined }], [])).toThrow();
});
