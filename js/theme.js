/* ===========================
   THEME MANAGER (Samsung Internet Anti-Force-Dark + Manual Switch)
   =========================== */
const ThemeManager = (function () {
  // "auto"  -> Light theme on normal browsers; Custom Dark theme on Samsung Internet / forced-dark browsers
  // "dark"  -> Forces Custom Dark theme everywhere
  // "light" -> Forces Light theme everywhere
  const MANUAL_CODE_OVERRIDE = "auto";

  // 1. Tell the browser immediately that we support light & dark so Samsung Internet
  // unlocks prefers-color-scheme: dark and disables its ugly auto-inversion filter
  function setColorSchemeMeta(contentValue) {
    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "color-scheme";
      document.head.appendChild(meta);
    }
    meta.content = contentValue;
  }

  // Must be set to "light dark" BEFORE querying matchMedia in Samsung Internet
  setColorSchemeMeta("light dark");

  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const isForcedDarkBrowser = /SamsungBrowser|MiuiBrowser/i.test(
    navigator.userAgent,
  );

  // 2. Hardware check: Detects if Samsung Internet / Android WebView is secretly
  // darkening white backgrounds even when matchMedia('(prefers-color-scheme: dark)') reports false
  function isBrowserAutoDarkening() {
    if (!document.body) return false;
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;background-color:#ffffff;color-scheme:normal;pointer-events:none;";
    document.body.appendChild(probe);
    const computedBg = window.getComputedStyle(probe).backgroundColor;
    document.body.removeChild(probe);

    // If #ffffff was altered to something darker than rgb(250, 250, 250), Forced Dark Mode is active
    const match = computedBg.match(/\d+/g);
    if (match && match.length >= 3) {
      const [r, g, b] = match.map(Number);
      return r < 245 || g < 245 || b < 245;
    }
    return false;
  }

  function shouldUseDarkTheme(effectiveMode) {
    if (effectiveMode === "dark") return true;
    if (effectiveMode === "light") return false;

    // In "auto" mode:
    // Activate custom dark theme if on Samsung/MIUI browser in dark mode,
    // OR if the browser is actively auto-darkening white backgrounds
    if (isForcedDarkBrowser && darkQuery.matches) return true;
    if (isBrowserAutoDarkening()) return true;

    return false;
  }

  function applyTheme(mode) {
    const htmlEl = document.documentElement;
    const effectiveMode = mode || MANUAL_CODE_OVERRIDE;

    // Temporarily allow "light dark" while probing on Samsung Internet
    if (isForcedDarkBrowser && effectiveMode === "auto") {
      setColorSchemeMeta("light dark");
    }

    const isDark = shouldUseDarkTheme(effectiveMode);

    htmlEl.setAttribute("data-theme", isDark ? "dark" : "light");
    // Lock form controls (radio buttons / inputs) to the chosen scheme
    setColorSchemeMeta(isDark ? "dark" : "light");

    // Swap com-900.png <-> com-900-white.png
    document.querySelectorAll(".features-image").forEach((img) => {
      const targetSrc = isDark
        ? "assets/images/com-900-white.png"
        : "assets/images/com-900.png";
      if (img.getAttribute("src") !== targetSrc) {
        img.setAttribute("src", targetSrc);
      }
    });
  }

  applyTheme(MANUAL_CODE_OVERRIDE);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      applyTheme(MANUAL_CODE_OVERRIDE),
    );
  }

  darkQuery.addEventListener("change", () => {
    if (MANUAL_CODE_OVERRIDE === "auto") {
      applyTheme("auto");
    }
  });

  return {
    setTheme(mode) {
      applyTheme(mode);
    },
  };
})();
