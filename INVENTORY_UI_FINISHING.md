# Astel-Com — inventory UI refinements

This patch is based on `astel-com_inventory-editor_language-guidance_changed-files.zip` (2026-11-20).

## Changes

- Moved **«Редагувати товар» / «Сховати редактор»** into a full-width utility row immediately beneath the product's main controls. **«Не збережено»** is right-aligned on the same row. **«Оновити»** and Delete remain aligned with price and availability; the prior reserved bottom padding has been removed.
- Specification table titles are now ordinary editable text fields without the native datalist dropdown arrow.
- Existing PDF attachments have a prominent **«Прикріплений зараз»** panel showing the actual filename and a **«Відкрити PDF»** link. The adjacent picker is labeled as an optional replacement. Existing IndexedDB PDFs can be opened via the existing `AstelProductFiles.hydrate()` helper.
- No change to product update/save semantics, translation validation, or catalog data. `css/admin.css` is not included or modified.

## Files

- `js/admin.js`
- `js/admin-new-product.js`
- `css/admin-photos.css`
- `tests/admin-inventory-finishing.test.js`

## Checks

```bash
node tests/admin-inventory-finishing.test.js
for test in tests/*.test.js; do node "$test" || exit 1; done
```

All existing tests plus the focused regression test passed. Isolated Chromium verification checked the non-dropdown title and current-PDF link, plus the separate product toolbar and status line. This is not a full hosted-site interaction test.
