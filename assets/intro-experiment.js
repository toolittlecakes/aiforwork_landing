(() => {
  const counter = 108774715;
  const experiment = "intro_video_v1";
  const root = document.documentElement;
  let variant = null;
  let clientId = null;
  let checkoutStarted = false;
  let checkoutEnrolled = false;
  let paymentOpened = false;
  root.dataset.introExperiment = "pending";

  function fail(reason) {
    root.dataset.introExperiment = "error";
    console.error(`[${experiment}] ${reason}`);
  }

  window.introExperiment = {
    paymentOpened() {
      if (!variant || paymentOpened) return;
      paymentOpened = true;
      ym(counter, "reachGoal", "aiforwork_payment_opened");
    },
    checkoutMetadata() {
      checkoutStarted = true;
      if (!variant || !clientId) return {};
      checkoutEnrolled = true;
      return { experiment, variant, metrikaClientId: clientId };
    },
    checkoutCreated() {
      if (!checkoutEnrolled) return Promise.resolve();
      return new Promise((resolve) => {
        const timer = setTimeout(resolve, 500);
        ym(counter, "reachGoal", "aiforwork_checkout_created", {}, () => {
          clearTimeout(timer);
          resolve();
        });
      });
    },
  };

  ym(counter, "getClientID", (id) => {
    if (typeof id === "string" && /^\d+$/.test(id)) clientId = id;
  });

  window.ymab = function () {
    (window.ymab.a = window.ymab.a || []).push(arguments);
  };
  ymab("metrika.108774715", "setConfig", {
    cookieDomain: "aiforwork.courses",
    enableVisual: false,
    enableRedir: false,
    enableAdv: false,
  });
  ymab("metrika.108774715", "init", (answer) => {
    clearTimeout(timeout);
    if (root.dataset.introExperiment === "error") return;
    const values = answer.flags?.[experiment];
    if (!values) {
      root.dataset.introExperiment = "excluded";
      return;
    }
    if (values.length !== 1 || !["with_video", "without_video"].includes(values[0])) {
      fail("Unexpected variant");
      return;
    }
    if (checkoutStarted) {
      fail("Assignment arrived after checkout started");
      return;
    }
    variant = values[0];
    root.dataset.introExperiment = variant;
    ym(counter, "params", { intro_video_v1: variant });
  });
  const timeout = setTimeout(() => fail("Varioqub did not initialize within 8 seconds"), 8000);
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://abt.s3.yandex.net/expjs/latest/exp.js";
  script.addEventListener("error", () => {
    clearTimeout(timeout);
    fail("Varioqub script could not load");
  });
  document.head.append(script);
})();
