# Inventory editor refinements — 2026-11-20

## What changed

- Restored consistent input and PDF file-picker styling to the existing-product form.
- Made the **Редагувати товар / Сховати редактор** button prominent and placed the **Не збережено** label directly below **Оновити**.
- Made Ukrainian and English editor tabs equal-width across the editor.
- Changed specification table headings from a fixed dropdown to directly editable centered title fields, with headings and labels remaining Ukrainian in both tabs. Existing built-in table names are prefilled; custom headings are saved as custom sections.
- Kept text **labels** in Ukrainian while switching actual Ukrainian/English content fields, including PDF document titles.
- Added guided validation: clicking **Оновити** with untranslated Ukrainian content switches to the English tab, shows `Перекладіть «…» англійською` placeholders, highlights missing fields, and scrolls to the first one. The product is not saved until both versions are complete.
- This validation also applies to new-product creation.
- Kept the existing `specSections` persistence and public product-page rendering. Confirmed in isolated browser tests that an edited characteristic saves and renders as a `<tr>` in the product specification table.

## Files

- `js/admin-new-product.js` — editable table headings, Ukrainian labels, guided bilingual validation.
- `js/admin.js` — validation before committing product edits; prominent editor controls.
- `admin.html` — keep the new-product description label Ukrainian.
- `css/admin-photos.css` — corrected styling and layout for existing-product forms.
- `tests/admin-editor-guidance.test.js` — regression coverage.

## Tests

From project root:

```bash
node tests/admin-editor-guidance.test.js
```

The existing Node test suite was also run. An isolated Chromium test confirmed the save-translation flow and store-side specification rendering. Full hosted-site browsing still needs device/server verification.

## Existing styles

`css/admin.css` was **not changed**, including your custom KPI `clamp()` rules. Your photo-card alignment and reversed footer remain intact.
