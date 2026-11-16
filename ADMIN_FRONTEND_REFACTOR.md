# Astel-Com — admin frontend cleanup

This changes only the **localStorage prototype**. It does not create real administration permissions, a database, or a payment / stock backend. Admin and storefront must run on the **same browser origin and profile** to share test data; different devices and browsers will not synchronize. Other open tabs can be refreshed to see updates.

## 1. Shared catalog overrides

`js/products-data.js` now exposes `CatalogManager` alongside `PRODUCTS_DATA`. On page load it reads `astelkom_catalog_overrides` and applies valid overrides to the product price (`price` and `numericPrice`), `inStock`, and `stockText`. It keeps all 15 original products, wholesale rules and other data unchanged. Invalid / missing overrides use the original product values.

`js/admin.js` updates the catalog only through `CatalogManager.updateProduct()`. Prices must be **whole hryvnia amounts from 1 to 99,999,999**, and stock availability must be a Boolean. Existing overrides are retained when only stock or only price changes.

The Ukrainian and English `products.html` pages reflect those effective prices and statuses, including the price filter bounds and the number of products in stock. Their add-to-cart buttons become disabled for unavailable products. The “від / from” price prefix is preserved.

`product.html` already renders from `PRODUCTS_DATA`, so it receives the adjusted price and availability automatically. `CartManager.getCart()` uses current catalog prices (instead of a stale stored cart price) and rechecks availability. `cart.html` flags unavailable items and blocks submitting checkout until they're removed. Historical orders are *not repriced* after placement.

## 2. Admin layout and script

- `js/admin.js` contains the former inline admin logic. `admin.html` only includes the script reference.
- Customer, order, tracking, and product strings are escaped before being interpolated into admin HTML. URLs used for order item images are restricted to local image assets; undo toasts now insert text with `textContent`.
- TTNs are checked by delivery service before saving and before moving an order to “Відправлено”. Nova Poshta uses a 14-digit number, Ukrposhta accepts a 13-character postal code or 13–14 digits, and Meest/unknown accepts an 8–32-character alphanumeric/hyphen identifier containing at least five digits. Adjust these rules if your actual shipping integration specifies another format.
- `scripts/sync-layout.js` leaves both the **custom admin header and compact footer** unchanged. Other pages continue using the shared partials. Formatting-only whitespace differences no longer force a rewrite.

## 3. Verification

Run from the project root (requires Node.js):

```bash
node tests/catalog-overrides.test.js
node tests/admin-safety.test.js
node tests/cart-rules.test.js
node tests/layout.test.js
node tests/localization.test.js
node tests/theme.test.js
node scripts/sync-layout.js
```

When developing, keep editing `partials/header.html` and `partials/footer.html` for regular pages. Run the layout sync, then `node scripts/build-localized-pages.js` to regenerate English pages if shared content changes. The admin page keeps its custom layout.

**Production warning:** Neither `admin.html` nor localStorage can enforce admin authorization or safe payments/orders. The future backend must authenticate administrators, validate prices and stock server-side, and store order / customer information centrally. Do not deploy the current admin as a secure management system.
