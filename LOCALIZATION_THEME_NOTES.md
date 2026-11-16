# Localization and Android dark-mode update

## English URLs

- Ukrainian pages stay in the project root (for example, `docs.html`).
- English counterparts are static pages in `en/` (for example, `en/docs.html`).
- `en/` pages share the existing root assets and scripts by using `<base href="../">`.
- Language switching navigates to the corresponding route, preserving URL query parameters and fragments.
- Shared navigation links, dynamically rendered product links, and account/checkout redirects should remain in the chosen locale.
- Rebuild English pages after editing any Ukrainian page or its metadata: `node scripts/build-localized-pages.js`.
- For **absolute** canonical and hreflang links on the real domain, rebuild with `ASTEL_SITE_ORIGIN=https://your-real-domain node scripts/build-localized-pages.js`. The default relative links work for local/static use, but absolute URLs are preferred for SEO. Do not deploy with a placeholder domain.
- The shared header/footer layouts retain their current markup. If you use `node scripts/sync-layout.js`, run the English-page builder again afterwards. The existing layout sync/test mismatch from the previous version is not part of this change.

## Explicit UI keys

- Shared interface labels now use `data-i18n="nav.*"` (and selected `docs.*`, `checkout.*`, `home.*`, `downloads.*` keys).
- Keys live in `UI_MESSAGES` in `js/i18n.js`; remaining product/long-form content still uses the existing translation dictionary as a transitional fallback.
- English product PDF labels come **exclusively** from `titleEn` in `js/products-data.js`. Actual PDF files and download filenames are not renamed or translated.
- Product pages are still parameterized (`product.html?id=...`), so their metadata is a localized generic product description, not a separately prerendered page for each SKU. If individual product SEO becomes a priority, add product-specific generated URLs and metadata in the later backend/site-build phase.
- The admin dashboard is deliberately not localized or modified in this pass.

## Samsung Internet

- `theme.js` no longer relies on reading a computed-color probe. Samsung Internet does **not reliably expose whether its Force Dark feature is on** through web APIs, and it can ignore site-supplied color-scheme settings.
- To ensure the custom dark styles appear in the Samsung case the previous detection missed, Samsung Internet on Android **defaults to custom dark**, even if the browser is actually in light mode. A small sun/moon button is added **only** to the Samsung header for per-site light/dark override (`astelkom_theme_preference` in localStorage).
- Ordinary desktop browsers stay light in automatic mode, even when the OS uses dark mode.
- Site CSS declares a theme via `data-theme`, `color-scheme`, and an early `<meta name="color-scheme">`. Samsung Internet may nevertheless apply its own transformations depending on version/settings; this cannot be guaranteed from web code. Test the actual device and Settings → Webpage view and scrolling → Dark mode → Force Dark mode for web content.

## Checks

```
node tests/localization.test.js
node tests/theme.test.js
node tests/cart-rules.test.js
node scripts/build-localized-pages.js
```

Browser interaction testing on an actual Samsung Internet browser is still required. The admin dashboard was intentionally left untouched.

## Chrome automatic translation and responsive header (2026-11-16)

- All public pages now declare an accurate `lang` and `translate="no"` on `<html>`, and include `<meta name="google" content="notranslate">`. This asks Chrome/Google Translate **not to offer its own automatic translation**; the site continues to use its own UK/EN localization. Browsers or user-invoked translation can still override this hint in some configurations.
- Language options have stable `data-lang="uk"` / `data-lang="en"` identifiers, rather than deriving the selected language from translated text. Menu anchors receive page-specific target URLs at initialization, and English pages render EN as the active trigger before JavaScript loads.
- At viewport widths **700px and above**, both the account icon and cart icon are in the right-hand header utilities. Below 700px, both stay in the mobile top-row controls.
- After modifying shared header markup, run `node scripts/sync-layout.js` (beware the pre-existing layout-sync mismatch and page-specific customizations), followed by `node scripts/build-localized-pages.js`. Direct edits to generated `/en/*.html` will be overwritten on rebuild.
- If Chrome has stored a previous auto-translation preference for the site, test the updated page in a fresh tab/profile and review Chrome translation settings. No website code can reliably prevent a user from explicitly choosing Translate.
