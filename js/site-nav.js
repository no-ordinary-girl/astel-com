// Shared header behavior for all static pages. Markup is generated from partials/header.html.
(function () {
  "use strict";

  function initSiteNavigation() {
    const toggle = document.getElementById("menu-toggle");
    const collapse = document.getElementById("menu-collapse");
    const moreToggle = document.getElementById("more-toggle");
    const moreDropdown = document.getElementById("header-more-dropdown");

    function closeMenu() {
      if (!collapse) return;
      collapse.classList.remove("header__collapse--open");
      toggle?.setAttribute("aria-expanded", "false");
    }

    if (toggle && collapse) {
      toggle.addEventListener("click", () => {
        const open = collapse.classList.toggle("header__collapse--open");
        toggle.setAttribute("aria-expanded", String(open));
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
        if (window.innerWidth >= 960) return;
        event.preventDefault();
        const open = moreDropdown.classList.toggle("is-open");
        moreToggle.setAttribute("aria-expanded", String(open));
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeMenu();
      moreDropdown?.classList.remove("is-open");
      moreToggle?.setAttribute("aria-expanded", "false");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSiteNavigation, { once: true });
  } else {
    initSiteNavigation();
  }
})();
