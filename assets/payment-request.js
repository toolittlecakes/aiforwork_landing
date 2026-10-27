(() => {
  const endpoints = {
    checkout: { path: "/v1/checkouts", timeoutMs: 20000 },
    promo: { path: "/v1/promo/check", timeoutMs: 10000 },
  };
  const report = (event, context) => window.dispatchEvent(new CustomEvent("payment:diagnostic", { detail: { event, ...context } }));

  class PaymentRequestError extends Error {
    constructor(code, requestId, status) {
      super(code);
      this.name = "PaymentRequestError";
      this.code = code;
      this.requestId = requestId;
      this.status = status;
    }
  }

  function validResponse(kind, data) {
    if (!data || typeof data !== "object") return false;
    if (kind === "promo") return Number.isInteger(data.amountMinor) && data.amountMinor > 0;
    if (typeof data.paymentUrl !== "string" || typeof data.checkoutId !== "string" || data.status !== "payment_link_created") return false;
    try {
      return new URL(data.paymentUrl).protocol === "https:";
    } catch {
      return false;
    }
  }

  window.paymentRequest = async (kind, body, onSlow) => {
    const { path, timeoutMs } = endpoints[kind];
    const requestId = crypto.randomUUID();
    const controller = new AbortController();
    const started = performance.now();
    const context = () => ({ requestId, operation: kind, durationMs: Math.round(performance.now() - started) });
    report("request_started", context());
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const slow = onSlow ? setTimeout(() => {
      onSlow();
      report("request_slow", context());
    }, 3000) : null;
    let status;
    try {
      const response = await fetch(`https://pay.aiforwork.courses${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Request-ID": requestId },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      status = response.status;
      const data = await response.json();
      if (!response.ok) {
        const knownCodes = ["provider.timeout", "provider.payment_link_failed", "request.rate_limited", "promo.invalid"];
        const code = knownCodes.includes(data?.error?.code) ? data.error.code : "server.error";
        throw new PaymentRequestError(code, requestId, status);
      }
      if (!validResponse(kind, data)) throw new PaymentRequestError("response.invalid", requestId, status);
      report("request_succeeded", context());
      return { data, requestId };
    } catch (cause) {
      const code = controller.signal.aborted ? "client.timeout"
        : cause instanceof PaymentRequestError ? cause.code
        : cause instanceof SyntaxError ? "response.invalid" : "network.error";
      report("request_failed", { ...context(), code, status });
      throw new PaymentRequestError(code, requestId, status);
    } finally {
      clearTimeout(timeout);
      clearTimeout(slow);
    }
  };
})();
