# Astel-Com inventory content editor update

## Changes
- English names are required for new products and categories. New descriptions, PDF labels and specification rows must also have English equivalents when provided.
- New-product photo gallery spans both columns in the creation form.
- Custom specification headings are edited directly (Ukrainian + English), with reusable suggestions from existing products. There is no additional "save heading" step.
- Table and PDF removal buttons use one consistent style.
- Existing inventory products now have a "Редагувати опис, таблиці та PDF" action below the always-visible photo gallery. It opens the same content editor. The **Оновити** button remains the only save/commit action.
- Editing a built-in product migrates its existing Technical/General specification rows into the common editable `specSections` structure. The product page renders the same specification content, now with editable bilingual values.
- Public Ukrainian and English product/documentation pages can download PDFs stored in IndexedDB.

## PDF storage
Previously PDF files were embedded as base64 inside localStorage and limited to 950 KB. Uploaded PDFs now use IndexedDB binary storage with metadata references `idb-pdf:<id>` in localStorage. There is **no application-imposed 950 KB limit**; upload size is constrained by the browser's available storage quota instead. The browser may request storage permission or reject files when disk space is insufficient. Existing static PDFs and older base64 uploads remain supported. Deleted PDF attachments are cleaned up after saved changes when they are no longer referenced.

**Prototype limitations:** All edits, images and PDFs remain browser-local. They are not synchronized with other devices or visible to customers on other browsers until you implement the backend. Back up this data before clearing site storage. IndexedDB is tied to the website origin and browser profile.

## Tests
From project root:

```
node tests/admin-product-content.test.js
node tests/admin-product-editor.test.js
node tests/catalog-overrides.test.js
```

No changes to `css/admin.css` / KPI column layout.
