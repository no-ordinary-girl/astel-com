# Inventory photo gallery update

The **Склад та ціни** panel now shows the photo gallery for every product without a separate “Фото” button.

- Drag photo tiles horizontally to change their order. The first image is the main catalog/product image.
- On touch devices, drag from the grip (⠿) shown below a photo.
- Keyboard alternative: focus a tile, then press **Alt + Left/Right**.
- Press **×** to remove a photo. At least one image must remain.
- Press **Додати фото** to upload additional PNG, JPEG or WebP images (up to 12 per product).
- Reordering/removing/uploading persists immediately to the existing browser-local catalog via `CatalogManager.updateProduct`.

The styles are in **`css/admin-photos.css`**, deliberately loaded after `css/admin.css` so customized admin KPI layouts remain intact. Interactions are in **`js/admin-photo-gallery.js`**. Include both files in your deployment.

Run `node tests/admin-photo-gallery.test.js` to verify the new gallery wiring and reordering function.

Note: As before, these photos and their order are saved only in localStorage for this browser/origin. For multi-device administration, a backend is necessary.
