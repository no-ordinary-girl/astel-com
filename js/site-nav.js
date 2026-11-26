// Shared header behavior for all static pages. Markup is generated from partials/header.html.
(function () {
  "use strict";

  function initSiteNavigation() {
    const toggle = document.getElementById("menu-toggle");
    const collapse = document.getElementById("menu-collapse");
    const moreToggle = document.getElementById("more-toggle");
    const moreDropdown = document.getElementById("header-more-dropdown");

    function closeMoreMenu() {
      if (!moreDropdown) return;
      moreDropdown.classList.remove("is-open");
      moreToggle?.setAttribute("aria-expanded", "false");
    }

    function closeMenu() {
      if (!collapse) return;
      collapse.classList.remove("header__collapse--open");
      toggle?.setAttribute("aria-expanded", "false");
    }

    if (toggle && collapse) {
      toggle.addEventListener("click", () => {
        const open = collapse.classList.toggle("header__collapse--open");
        toggle.setAttribute("aria-expanded", String(open));
        closeMoreMenu();
      });
    }

    document.querySelectorAll(".header__nav a.header__link").forEach((link) => {
      link.addEventListener("click", (event) => {
        closeMenu();
        if (link.getAttribute("href") !== "#footer") return;
        const footer = document.getElementById("footer");
        if (!footer) return;
        event.preventDefault();
        link.blur();
        // Give the mobile menu a moment to start closing before scrolling.
        window.setTimeout(() => footer.scrollIntoView({ behavior: "smooth" }), 100);
      });
    });

    if (moreToggle && moreDropdown) {
      moreToggle.addEventListener("click", (event) => {
        // Match the compact header breakpoint in global.css (700–1149px).
        if (window.innerWidth < 700 || window.innerWidth >= 1150) return;
        event.preventDefault();
        const open = moreDropdown.classList.toggle("is-open");
        moreToggle.setAttribute("aria-expanded", String(open));
      });

      // Close after a click/tap outside, including elsewhere in the header.
      // Pointer events cover both mouse and touch without interfering with
      // clicks on the dropdown's own links.
      document.addEventListener("pointerdown", (event) => {
        if (!moreDropdown.contains(event.target)) closeMoreMenu();
      });

      // Also dismiss when keyboard focus leaves the dropdown.
      document.addEventListener("focusin", (event) => {
        if (!moreDropdown.contains(event.target)) closeMoreMenu();
      });

      moreDropdown.querySelectorAll(".header__more-link").forEach((link) => {
        link.addEventListener("click", closeMoreMenu);
      });

      // Do not carry an open state between mobile/compact/desktop layouts.
      window.addEventListener("resize", () => {
        if (window.innerWidth < 700 || window.innerWidth >= 1150) closeMoreMenu();
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeMenu();
      if (moreDropdown?.classList.contains("is-open") && moreDropdown.contains(document.activeElement)) {
        moreToggle?.focus();
      }
      closeMoreMenu();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSiteNavigation, { once: true });
  } else {
    initSiteNavigation();
  }
})();
