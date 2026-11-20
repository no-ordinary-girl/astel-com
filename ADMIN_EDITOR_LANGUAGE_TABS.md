# Inventory editor: collapsible photos + language tabs

## Existing products

Open **Редагувати товар** under a product's name to work with its photos, Ukrainian/English descriptions, specification tables, and PDFs in one place. Photos and their drag-and-drop controls are hidden while the editor is collapsed. Nothing is published until **Оновити** is clicked in that product's inventory row.

The **Українська / English** tabs only change which text fields are visible; they do not clear or save values. Specification rows and PDF attachments remain a single shared list with separate language-specific names. Both translations are checked when saving. A tab change alone does not mark the product as modified.

## New products

The new-product form uses the same language tabs for the description, specifications, custom table titles, and PDF titles. Both Ukrainian and English content is required where relevant.

Existing-product English descriptions and specification fields are initially filled using `I18nManager.translateForBuild` from `js/i18n.js`, regardless of the admin page's Ukrainian locale. Existing manually written English translations take precedence. If a phrase has no English mapping, it remains **blank** for a human translation rather than copying Ukrainian text into the English field.

## Testing

```bash
node tests/admin-language-tabs.test.js
node tests/admin-photo-gallery.test.js
```

The inventory data and PDFs are still local browser data until a backend is connected. The existing image styling and KPI layout were preserved.
