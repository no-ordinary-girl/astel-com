# Astel-Com — Inventory editing, deletion and new-product specifications

## Apply

Extract the changed-files archive into your project, replacing the matching files while preserving the `astel-com/` folder structure. This update **does not replace `css/admin.css`**; the owner's custom KPI layout and other CSS changes are preserved.

### Existing products: "Оновити" now saves everything

Price, category, sale terms, stock, added or removed photos, and drag-reordered photos stay in a **temporary page draft** until "Оновити" is clicked on that product. Changes are not written to localStorage or propagated to the catalog before saving. The button is disabled when there are no pending changes; modified rows show "Не збережено". Reloading the admin page discards unsaved drafts.

The existing drag-and-drop/keyboard photo controls remain supported. The custom photo-tile alignment has been retained: `align-items: start` and the footer's `flex-direction: row-reverse`.

### Deleting products

The trash button prompts for confirmation. Custom products are removed from localStorage; built-in products are hidden with a persisted tombstone (`astelkom_catalog_deleted_products`). Existing orders remain unchanged, but items deleted from the catalog become unavailable in old saved carts until removed.

The delete button uses **`assets/images/delete.svg`**. The icon is not in this archive because the owner said that it already exists in their working project. Confirm its path when applying the update.

### New products

"+ Додати новий товар" now supports:

- Up to 8 separate specification tables, each marked **Технічні характеристики** or **Основні характеристики**, each with up to 25 name/value rows. Tables appear in the order they were added.
- Up to 8 PDF documents, each with Ukrainian and optional English display titles. They appear on the product page and the documentation page; the downloaded file retains its original filename.
- Images, stock status, price, categories, sale terms, titles and description as before.

PDF files must be <=950 KB each; they are kept as data URLs in **the current browser's localStorage**, not uploaded to GitHub Pages or a server. Space is limited and depends on other saved images and data. For production, store uploads on a server/object-storage service and keep only their URLs and metadata in the database.

## Test commands

```bash
node tests/admin-product-editor.test.js
node tests/admin-photo-gallery.test.js
# or run all tests:
for f in tests/*.test.js; do node "$f"; done
```

All 12 automated Node tests passed in this environment. Isolated Chromium interaction checks passed for product updates and new-product creation/deletion, and public documentation/specification rendering. Full navigation of a hosted site was not tested here.
