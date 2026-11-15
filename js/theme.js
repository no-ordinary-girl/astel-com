/* ===========================
   THEME MANAGER (Forced Dark Browsers + Manual Code Switch)
   =========================== */
const ThemeManager = (function () {
  // CHANGE THIS CONSTANT IN CODE IF YOU WANT TO FORCE A THEME MANUALLY:
  // "auto"  -> Uses dark theme only on dark-mode browsers (like Samsung Internet)
  // "dark"  -> Forces dark theme everywhere
  // "light" -> Forces light theme everywhere
  const MANUAL_CODE_OVERRIDE = "light";

  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  // Ensure <meta name="color-scheme" content="light dark"> exists so Samsung Internet
  // disables its automatic ugly dark-mode filter and uses our custom CSS instead
  function ensureColorSchemeMeta() {
    if (!document.querySelector('meta[name="color-scheme"]')) {
      const meta = document.createElement("meta");
      meta.name = "color-scheme";
      meta.content = "light dark";
      document.head.appendChild(meta);
    }
  }

  // Detects Samsung Internet (or Xiaomi MIUI Browser)
  const isForcedDarkBrowser = /SamsungBrowser|MiuiBrowser/i.test(
    navigator.userAgent,
  );

  function applyTheme(mode) {
    const htmlEl = document.documentElement;
    const effectiveMode = mode || MANUAL_CODE_OVERRIDE;

    // If "auto": ONLY turn on dark mode if the browser is Samsung/MIUI AND in dark mode!
    // Desktop and normal mobile browsers will stay in Light Mode.
    const isDark =
      effectiveMode === "dark" ||
      (effectiveMode === "auto" && isForcedDarkBrowser && darkQuery.matches);

    htmlEl.setAttribute("data-theme", isDark ? "dark" : "light");

    document.querySelectorAll(".features-image").forEach((img) => {
      const targetSrc = isDark
        ? "assets/images/com-900-white.png"
        : "assets/images/com-900.png";
      if (img.getAttribute("src") !== targetSrc) {
        img.setAttribute("src", targetSrc);
      }
    });
  }

  ensureColorSchemeMeta();
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
