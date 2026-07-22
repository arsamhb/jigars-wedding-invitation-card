(function () {
  // ===========================================================================
  // Config
  // ===========================================================================

  const REVEAL_MS = 4000;
  const PAUSE_MS = 2000;
  const SPIRAL_MS = 4200;
  const EVENT_DETAILS_CHAR_MS = 110;
  const SPOTLIGHT_EXPAND_MS = 4000;
  const SPOTLIGHT_CHAR_MS = 32;

  const HEADLINE_HEIGHT_RATIO = 0.9;
  const HEADLINE_WIDTH_RATIO = 0.92;
  const HEADLINE_MIN_PX = 10;
  const HEADLINE_MAX_PX = 280;
  const HEADLINE_FIT_TOLERANCE = 0.25;

  const FEATURED_PHOTO_ID = "featured-photo";

  // System to configure texts so they can be shown in correct language, font, and direction
  const TEXTS = {
    spotlight: {
      content: `هر کدام از آدم‌های عزیز زندگی، سهمی در خاطرات زیبای ما دارند؛ و شما بی‌شک یکی از همان عزیزانی هستید که دوست داریم در مهم‌ترین روز زندگی‌مان کنارمان باشید.

با افتخار و از صمیم قلب، شما را به جشن آغاز زندگی مشترکمان دعوت می‌کنیم تا شادی این شب را با حضورتان کامل‌تر کنید.

حضور شما برای ما ارزشمندترین هدیه است و امیدواریم در کنار هم، شبی پر از لبخند، عشق و خاطرات ماندگار بسازیم.

خواهشمندیم در صورتی که امکان حضور در مراسم را ندارید، لطفاً تا یک هفته آینده ما را مطلع فرمایید تا بتوانیم برنامه‌ریزی مراسم را با دقت بیشتری انجام دهیم.

مشتاقانه منتظر دیدار شما و ساختن یکی از زیباترین خاطرات زندگی‌مان در کنار شما هستیم`,
      lang: "fa",
      dir: "rtl",
    },
    addressCta: {
      content: "آدرس",
      lang: "fa",
      dir: "rtl",
    },
  };

  const ADDRESS_PAGE_URL = "address.html";
  const ADDRESS_CTA_DELAY_MS = 2600;

  // ===========================================================================
  // DOM refs
  // ===========================================================================

  const featuredPhoto = document.getElementById(FEATURED_PHOTO_ID);
  const eventDetailsEl = document.querySelector(".event-details");
  const copyColumn = document.querySelector(".invitation__copy-column");
  const photoColumn = document.querySelector(".invitation__photo-column");
  const headlineStack = document.querySelector(".headline-stack");
  const spiralPrelude = document.querySelector(".intro-spiral-prelude");

  if (!featuredPhoto || !eventDetailsEl) return;

  const sourceImg = featuredPhoto.querySelector("img");
  if (!sourceImg) return;

  let spotlightStarted = false;
  let headlineFitFrame = 0;

  // ===========================================================================
  // Viewport height (iOS Safari / mobile browser toolbar quirks)
  // ===========================================================================

  function getViewportHeight() {
    if (window.visualViewport && window.visualViewport.height > 0) {
      return window.visualViewport.height;
    }
    return window.innerHeight || document.documentElement.clientHeight;
  }

  function syncAppHeight() {
    document.documentElement.style.setProperty(
      "--app-height",
      `${Math.round(getViewportHeight())}px`,
    );
  }

  syncAppHeight();
  window.addEventListener("resize", syncAppHeight, { passive: true });
  window.addEventListener("orientationchange", syncAppHeight, {
    passive: true,
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncAppHeight, {
      passive: true,
    });
    window.visualViewport.addEventListener("scroll", syncAppHeight, {
      passive: true,
    });
  }

  document.documentElement.style.setProperty(
    "--intro-reveal-duration",
    `${REVEAL_MS}ms`,
  );
  document.documentElement.style.setProperty(
    "--intro-spiral-duration",
    `${SPIRAL_MS}ms`,
  );
  document.documentElement.style.setProperty(
    "--hero-expand-duration",
    `${SPOTLIGHT_EXPAND_MS}ms`,
  );

  // ===========================================================================
  // Utilities
  // ===========================================================================

  function typeText(el, text, delayMs, onDone) {
    let index = 0;
    el.textContent = "";

    const tick = () => {
      if (index < text.length) {
        el.textContent += text.charAt(index);
        index += 1;
        window.setTimeout(tick, delayMs);
      } else if (onDone) {
        onDone();
      }
    };

    tick();
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // ===========================================================================
  // Headline fit
  // ===========================================================================

  function getHeadlineFitTargets() {
    const viewportHeight = getViewportHeight();
    const copySection = headlineStack?.closest(".invitation__copy-column");
    const maxWidth = copySection
      ? copySection.clientWidth * HEADLINE_WIDTH_RATIO
      : window.innerWidth * HEADLINE_WIDTH_RATIO;

    return {
      height: viewportHeight * HEADLINE_HEIGHT_RATIO,
      width: maxWidth,
    };
  }

  function applyHeadlineFontSize(px) {
    if (!headlineStack) return;
    headlineStack.style.setProperty("--headline-font-size", `${px}px`);
  }

  function measureHeadlineStack() {
    return headlineStack.getBoundingClientRect();
  }

  function headlineFits(px, targets) {
    applyHeadlineFontSize(px);
    void headlineStack.offsetHeight;

    const { height, width } = measureHeadlineStack();
    return height <= targets.height && width <= targets.width;
  }

  function fitHeadlineStack() {
    if (!headlineStack) return;

    const targets = getHeadlineFitTargets();

    applyHeadlineFontSize(HEADLINE_MIN_PX);
    void headlineStack.offsetHeight;
    if (
      measureHeadlineStack().height >= targets.height &&
      measureHeadlineStack().width >= targets.width
    ) {
      applyHeadlineFontSize(HEADLINE_MIN_PX);
      return;
    }

    applyHeadlineFontSize(HEADLINE_MAX_PX);
    void headlineStack.offsetHeight;
    if (headlineFits(HEADLINE_MAX_PX, targets)) {
      applyHeadlineFontSize(HEADLINE_MAX_PX);
      return;
    }

    let lo = HEADLINE_MIN_PX;
    let hi = HEADLINE_MAX_PX;

    while (hi - lo > HEADLINE_FIT_TOLERANCE) {
      const mid = (lo + hi) / 2;
      if (headlineFits(mid, targets)) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    applyHeadlineFontSize(lo);
  }

  function scheduleHeadlineFit() {
    cancelAnimationFrame(headlineFitFrame);
    headlineFitFrame = requestAnimationFrame(() => {
      syncAppHeight();
      fitHeadlineStack();
    });
  }

  // ===========================================================================
  // Readiness
  // ===========================================================================

  function waitForImages() {
    const images = Array.from(
      document.querySelectorAll(".invitation__photo-column img"),
    );
    return Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
      }),
    );
  }

  function waitForReady() {
    const fontsReady =
      document.fonts && document.fonts.ready
        ? document.fonts.ready
        : Promise.resolve();

    return Promise.all([fontsReady, waitForImages()]).then(
      () => new Promise((resolve) => requestAnimationFrame(resolve)),
    );
  }

  // ===========================================================================
  // Layout helpers
  // ===========================================================================

  function reserveEventDetailsSpace(el, text) {
    el.textContent = text;
    const { width, height } = el.getBoundingClientRect();
    el.style.minWidth = `${Math.ceil(width)}px`;
    el.style.minHeight = `${Math.ceil(height)}px`;
    el.textContent = "";
  }

  function lockCardLayout() {
    if (copyColumn) {
      const rect = copyColumn.getBoundingClientRect();
      copyColumn.style.width = `${rect.width}px`;
      copyColumn.style.flex = "0 0 auto";
    }

    if (photoColumn) {
      const rect = photoColumn.getBoundingClientRect();
      photoColumn.style.width = `${rect.width}px`;
      photoColumn.style.flex = "0 0 auto";
      photoColumn.style.minHeight = `${rect.height}px`;
    }

    document.body.classList.add("is-layout-locked");
  }

  // ===========================================================================
  // Spiral prelude
  // ===========================================================================

  function finishSpiralPrelude() {
    document.body.classList.remove("is-spiral-active");
    document.body.classList.add("is-after-spiral");
    if (spiralPrelude) {
      spiralPrelude.remove();
    }
  }

  function runSpiralPrelude() {
    if (prefersReducedMotion() || !spiralPrelude) {
      finishSpiralPrelude();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let settled = false;

      const done = () => {
        if (settled) return;
        settled = true;
        spiralPrelude.removeEventListener("animationend", onAnimationEnd);
        finishSpiralPrelude();
        resolve();
      };

      const onAnimationEnd = (event) => {
        if (event.target !== spiralPrelude) return;
        done();
      };

      spiralPrelude.addEventListener("animationend", onAnimationEnd);
      window.setTimeout(done, SPIRAL_MS + 120);
    });
  }

  // ===========================================================================
  // Intro sequence
  // ===========================================================================

  async function runIntroSequence() {
    const eventDetailsText =
      eventDetailsEl.dataset.eventDetails || eventDetailsEl.textContent.trim();
    eventDetailsEl.classList.remove(
      "event-details--typing",
      "event-details--done",
    );

    if (prefersReducedMotion()) {
      finishSpiralPrelude();
      document.body.classList.remove("is-intro-pending");
      document.body.classList.add("is-intro-revealing");
      eventDetailsEl.textContent = eventDetailsText;
      eventDetailsEl.classList.add("event-details--done");
      return;
    }

    reserveEventDetailsSpace(eventDetailsEl, eventDetailsText);
    lockCardLayout();

    document.body.classList.remove("is-intro-pending");
    document.body.classList.add("is-intro-revealing");

    await delay(REVEAL_MS);
    await delay(PAUSE_MS);

    eventDetailsEl.classList.add("event-details--typing");
    await new Promise((resolve) => {
      typeText(eventDetailsEl, eventDetailsText, EVENT_DETAILS_CHAR_MS, () => {
        eventDetailsEl.classList.add("event-details--done");
        resolve();
      });
    });
  }

  // ===========================================================================
  // Photo spotlight
  // ===========================================================================

  function revealAddressCta(overlay) {
    if (overlay.querySelector(".photo-spotlight__address")) return;

    const cta = document.createElement("a");
    cta.className = "photo-spotlight__address";
    cta.href = ADDRESS_PAGE_URL;
    cta.setAttribute("lang", TEXTS.addressCta.lang);
    cta.setAttribute("dir", TEXTS.addressCta.dir);
    cta.innerHTML = `
      <svg class="photo-spotlight__address-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 21s-6.5-5.4-6.5-10.2A6.5 6.5 0 0 1 12 4.3a6.5 6.5 0 0 1 6.5 6.5C18.5 15.6 12 21 12 21z"></path>
        <circle cx="12" cy="10.5" r="2.4"></circle>
      </svg>
      <span class="photo-spotlight__address-label">${TEXTS.addressCta.content}</span>
    `;

    overlay.appendChild(cta);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cta.classList.add("photo-spotlight__address--visible");
      });
    });
  }

  function beginSpotlightTyping(overlay, messageEl) {
    overlay.classList.add("photo-spotlight--typing");
    typeText(messageEl, TEXTS.spotlight.content, SPOTLIGHT_CHAR_MS, () => {
      messageEl.classList.add("photo-spotlight__message--done");
      window.setTimeout(() => revealAddressCta(overlay), ADDRESS_CTA_DELAY_MS);
    });
  }

  function startPhotoSpotlight() {
    if (spotlightStarted) return;
    spotlightStarted = true;

    const rect = featuredPhoto.getBoundingClientRect();
    const overlay = document.createElement("div");
    overlay.className = "photo-spotlight";
    overlay.setAttribute("role", "presentation");

    // Apply lang and dir to the spotlight based on config
    const textConfig = TEXTS.spotlight;

    overlay.innerHTML = `
      <div class="photo-spotlight__viewport">
        <img src="" alt="" decoding="async">
        <div class="photo-spotlight__dim" aria-hidden="true"></div>
      </div>
      <p class="photo-spotlight__message" aria-live="polite" lang="${textConfig.lang}" dir="${textConfig.dir}"></p>
    `;

    const viewport = overlay.querySelector(".photo-spotlight__viewport");
    const img = overlay.querySelector(".photo-spotlight__viewport img");
    const messageEl = overlay.querySelector(".photo-spotlight__message");

    img.src = sourceImg.currentSrc || sourceImg.src;
    img.alt = sourceImg.alt || "";

    viewport.style.setProperty("--reveal-top", `${rect.top}px`);
    viewport.style.setProperty("--reveal-left", `${rect.left}px`);
    viewport.style.setProperty("--reveal-width", `${rect.width}px`);
    viewport.style.setProperty("--reveal-height", `${rect.height}px`);

    document.body.classList.add("is-spotlight-pending");
    document.body.appendChild(overlay);

    let typingStarted = false;

    const startTyping = () => {
      if (typingStarted) return;
      typingStarted = true;
      viewport.removeEventListener("transitionend", onExpanded);
      window.setTimeout(
        () => beginSpotlightTyping(overlay, messageEl),
        PAUSE_MS,
      );
    };

    const onExpanded = (event) => {
      if (event.propertyName !== "width") return;
      startTyping();
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add("photo-spotlight--expanded");
        document.body.classList.add("is-spotlight-active");
      });
    });

    viewport.addEventListener("transitionend", onExpanded);

    window.setTimeout(startTyping, SPOTLIGHT_EXPAND_MS + 120);
  }

  // ===========================================================================
  // Init
  // ===========================================================================

  async function init() {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    fitHeadlineStack();
    window.addEventListener("resize", scheduleHeadlineFit, { passive: true });

    const readyPromise = waitForReady();
    await runSpiralPrelude();
    await readyPromise;
    await runIntroSequence();
    await delay(PAUSE_MS);
    startPhotoSpotlight();
  }

  init();
})();
