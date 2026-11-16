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

## Samsung Internet (native forced-dark behavior restored)

- Samsung Internet users control forced website darkening in their browser settings. There is **no site-specific light/dark button**, no persistent `astelkom_theme_preference`, and no automatic custom-dark override based solely on the Samsung browser's user agent.
- In automatic mode, Samsung Internet receives the original light-page CSS and applies its own force-dark conversion **only if the visitor enabled it in the browser**. The site does not attempt to detect that private browser setting, because `prefers-color-scheme` and computed colors are not reliable indicators of Samsung's forced inversion.
- The original custom `html[data-theme="dark"]` CSS palette remains unchanged. Non-Samsung Android browsers that report a dark preference through the existing MIUI/WebView branch may still use it; normal desktop browsers stay light by default.
- The existing `<meta name="color-scheme" content="light dark">` remains in place for Samsung. We deliberately avoid writing `color-scheme: only light`, which may block browser-provided darkening.
- Samsung may invert or retain images unpredictably. Check product imagery, trust logos and icons on a real Samsung device with **Force Dark mode for web content** on and off. There is no portable browser API that can force Samsung's rendering to be identical to a custom CSS palette.

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
