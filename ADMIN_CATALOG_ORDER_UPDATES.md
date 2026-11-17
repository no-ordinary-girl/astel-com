# Astel-Com — Admin workflow and catalog update

This update builds on the previous admin frontend refactor and 15-minute order-editing-window update. **This is a localStorage demo, not a secure or synchronized backend.**

## Orders

- Added a per-order `paymentStatus` (`unpaid`/`paid`). Payment method remains separate (`Готівка`, card, Google Pay).
- `Прийнято` is green only when the payment method is cash or payment status is `paid`; the `редагування` suffix is removed from the status labels. The customer order-status badge follows the same condition.
- While an order is **В обробці**, the manager can edit customer name/phone/email, city, delivery carrier/type/branch, payment method, and line-item quantities; add or remove catalog items; and save recalculated totals. Other states are read-only until reopened.
- Revenue is stored per order as `recognizedRevenue`. First completion records the order's subtotal; reopening preserves that amount; completing it again reconciles it to the updated subtotal, rather than adding another order's worth of revenue. Canceling clears its recognized contribution; undo restores the whole prior order snapshot. Legacy completed orders without `recognizedRevenue` count their subtotal.
- No admin orders appear before the existing 15-minute customer edit window ends or the customer explicitly submits early.

## Inventory and storefront

- `js/products-data.js` is the single source for existing and newly created products. Admin price/availability overrides still use `astelkom_catalog_overrides`.
- Category, sales terms and photo order are now editable. Sales terms update `minOrderQty` (wholesale: 10; retail: 1). Photo up/down arrows set the first photo as the main image in the catalog and product gallery.
- The inventory view supports PNG/JPEG/WebP uploads. Images are converted to bounded-size JPEGs before being stored. A minimum of one image is required per product.
- New products are stored under `astelkom_catalog_custom_products`, and appear in the product listing, detail page, cart and English listing after a page reload. The admin form allows an optional English product title; other new-product content may need English translation.
- `products.html` and `en/products.html` no longer contain duplicated hard-coded product cards. `js/products-catalog.js` renders them from `PRODUCTS_DATA`, including counts, category, availability, price filters, cart quantity controls and links.
- The cart now refreshes saved product images and titles from current product data in addition to price and stock.

## Limitations before backend development

- localStorage is scoped to **one browser profile and origin**, not shared across devices. It is user-editable and not suitable for real inventory, financial accounting, customer information or privileged manager access.
- Image uploads are constrained by the browser's storage quota. Upload modest photos; images from this prototype cannot be used by customers on other devices.
- No real payment verification occurs: `paymentStatus` is a manager-controlled demo field.
- Order histories and accounting need server-side integrity, audit logs, authorization and payment reconciliation before launch.

## Checks

```bash
node tests/admin-inventory-finance.test.js
node tests/admin-safety.test.js
node tests/cart-rules.test.js
node tests/catalog-overrides.test.js
node tests/layout.test.js
node tests/localization.test.js
node tests/order-lifecycle.test.js
node tests/theme.test.js
```

Regenerate English pages after future changes to Ukrainian page markup:

```bash
node scripts/build-localized-pages.js
```
