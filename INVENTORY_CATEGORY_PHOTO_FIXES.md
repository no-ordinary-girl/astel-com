# Inventory categories, new-product photos and specification table names

This update keeps the storefront and admin dashboard as browser-local prototypes.

## Apply

Extract the changed-files ZIP over the existing Astel-Com directory, preserving its folder structure. Do not replace `css/admin.css`: your KPI grid and other custom styles are unchanged. The photo cards keep `align-items: start` and the footer's `flex-direction: row-reverse`.

## Changes

- The `Оновити` and trash buttons stay on the same row; the unsaved indicator is displayed below them.
- **New product photos:** Multiple PNG/JPG/WebP files can be selected at once or in successive selections. Preview cards are shown immediately; remove or reorder them before saving. The first image is the main product image. At least one is required, with the original 12-photo limit.
- **Custom specification table names:** Select `+ Створити нову назву…`, enter a Ukrainian name and optionally an English name, then save the name. It becomes selectable for other tables. Saved custom names are derived from products already in the catalog; a name disappears when its final saved product/table and any unsaved form selection are gone. Newly created tables appear with those names on product detail pages.
- **Categories:** The admin inventory section now provides a category manager with Ukrainian/optional English names. New categories become available in the inventory editor, new-product form, and catalog sidebar in both languages. Categories cannot be deleted while any saved product uses them; reassign those products and save first. You can also remove an empty built-in category.

The category registry is kept locally under `astelkom_catalog_categories` and `astelkom_catalog_removed_categories`. It is not synchronized to other browsers or devices. Static homepage category showcase tiles are curated separately and not automatically generated from the category registry.

## Tests

From the project root:

```bash
for test in tests/*.test.js; do node "$test"; done
```

The added `tests/admin-categories-custom-specs.test.js` verifies category persistence/deletion and custom table metadata. Isolated Chromium interaction tests also covered multiple photo selections, gallery previews, photo order, removing previews, category creation/deletion, and custom table dropdown reuse.

## Production note

Photos and inventory changes still use localStorage. Move the category registry, product data and image storage to backend-managed services before exposing inventory editing to real users.
