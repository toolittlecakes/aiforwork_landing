(() => {
  const state = window.landingObservability = { status: "loading" };
  const sdk = window.O2_LOGS;
  if (!sdk) {
    state.status = "unavailable";
    console.warn("Landing monitoring: SDK did not load");
    return;
  }

  const pageId = crypto.randomUUID();
  const version = "2026-10-27.1";
  const paymentEvents = new Set(["request_started", "request_slow", "request_succeeded", "request_failed", "redirect_requested", "checkout_failed"]);
  const codes = new Set(["provider.timeout", "provider.payment_link_failed", "request.rate_limited", "promo.invalid", "server.error", "client.timeout", "response.invalid", "network.error", "checkout.error"]);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  function urlWithoutQuery(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:" ? `${url.origin}${url.pathname}` : "[non-http URL]";
    } catch {
      return "[invalid URL]";
    }
  }

  function redact(value, limit) {
    return String(value ?? "")
      .replace(/https?:\/\/[^\s<>"')]+/g, urlWithoutQuery)
      .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email]")
      .slice(0, limit);
  }

  function beforeSend(log) {
    const network = log.origin === "network";
    const clean = {
      date: log.date,
      status: log.status,
      origin: log.origin,
      message: network ? `Network error: ${urlWithoutQuery(log.http?.url)}` : redact(log.message, 500),
      project: "aiforwork",
      service: "landing",
      environment: "production",
      release: version,
      page_id: pageId,
      page_path: location.pathname,
      event: log.event === "page_loaded" ? "page_loaded"
        : paymentEvents.has(log.event) ? log.event : network ? "network_error" : "browser_error",
      browser: navigator.userAgent.slice(0, 300),
      view: { url: `${location.origin}${location.pathname}` },
    };
    if (uuid.test(log.request_id)) clean.request_id = log.request_id;
    if (log.operation === "checkout" || log.operation === "promo") clean.operation = log.operation;
    if (codes.has(log.error_code)) clean.error_code = log.error_code;
    if (Number.isFinite(log.duration_ms) && log.duration_ms >= 0) clean.duration_ms = log.duration_ms;
    if (Number.isInteger(log.http_status) && log.http_status >= 0 && log.http_status <= 599) clean.http_status = log.http_status;
    if (log.error && !network) clean.error = { kind: redact(log.error.kind, 100), stack: redact(log.error.stack, 4000) };
    if (network) clean.http = { url: urlWithoutQuery(log.http?.url), status_code: log.http?.status_code };
    for (const key of Object.keys(log)) delete log[key];
    Object.assign(log, clean);
    return true;
  }

  window.addEventListener("payment:diagnostic", ({ detail }) => {
    if (!detail || !paymentEvents.has(detail.event)) return;
    const context = {
      event: detail.event,
      request_id: detail.requestId,
      operation: detail.operation,
      duration_ms: detail.durationMs,
      error_code: detail.code,
      http_status: detail.status,
    };
    const level = detail.event.endsWith("failed") ? "error" : detail.event === "request_slow" ? "warn" : "info";
    sdk.logger[level](`payment.${detail.event}`, context);
  });

  async function initialize() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch("https://pay.aiforwork.courses/telemetry/config.json", {
        signal: controller.signal,
        credentials: "omit",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("monitoring configuration unavailable");
      const config = await response.json();
      if (typeof config.clientToken !== "string" || config.clientToken.length < 10) throw new Error("invalid monitoring configuration");
      sdk.init({
        clientToken: config.clientToken,
        site: "pay.aiforwork.courses",
        organizationIdentifier: "default",
        service: "landing",
        env: "production",
        version,
        apiVersion: "v1",
        insecureHTTP: false,
        sessionSampleRate: 100,
        telemetrySampleRate: 0,
        trackAnonymousUser: false,
        forwardErrorsToLogs: true,
        forwardConsoleLogs: [],
        forwardReports: [],
        beforeSend,
      });
      state.status = "initialized";
      sdk.logger.info("landing.page_loaded", { event: "page_loaded" });
    } catch {
      state.status = "unavailable";
      console.warn("Landing monitoring: initialization failed; events are not being delivered");
    } finally {
      clearTimeout(timeout);
    }
  }
  initialize();
})();
