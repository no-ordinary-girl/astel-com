/* Admin inventory photo ordering. Dependency-free, mouse + touch + keyboard.
   Gallery markup is rendered by admin.js; this module owns interactions only. */
(function (root) {
  "use strict";

  function moveImages(images, from, target, after) {
    if (!Array.isArray(images) || !Number.isInteger(from) || !Number.isInteger(target) ||
        from < 0 || target < 0 || from >= images.length || target >= images.length) {
      return { images: Array.isArray(images) ? images.slice() : [], newIndex: -1, changed: false };
    }
    const result = images.slice();
    let index = target + (after ? 1 : 0);
    const moved = result.splice(from, 1)[0];
    if (from < index) index--;
    if (index === from) return { images: result, newIndex: from, changed: false };
    result.splice(index, 0, moved);
    return { images: result, newIndex: index, changed: true };
  }

  function mount(container, onReorder) {
    if (!container || typeof onReorder !== "function") return () => {};
    let dragging = null;
    const eventHandlers = [];
    const listen = (type, handler) => {
      container.addEventListener(type, handler);
      eventHandlers.push([type, handler]);
    };
    const clearMarks = () => container.querySelectorAll(".admin-photo-item.is-drop-before,.admin-photo-item.is-drop-after")
      .forEach(item => item.classList.remove("is-drop-before", "is-drop-after"));
    const clearDragged = () => container.querySelectorAll(".admin-photo-item.is-dragging")
      .forEach(item => item.classList.remove("is-dragging"));
    const mark = (target) => {
      clearMarks();
      if (target) target.item.classList.add(target.after ? "is-drop-after" : "is-drop-before");
    };
    const locate = (x, y, id) => {
      const element = document.elementFromPoint(x, y);
      const item = element?.closest(".admin-photo-item");
      if (!item || item.closest("[data-product-photos]")?.dataset.productPhotos !== id) return null;
      const rect = item.getBoundingClientRect();
      return { item, index: Number(item.dataset.photoIndex), after: x > rect.left + rect.width / 2 };
    };
    const commit = (id, from, target) => {
      if (!target) return;
      onReorder({ id, from, target: target.index, after: target.after });
    };

    listen("dragstart", e => {
      const item = e.target.closest?.(".admin-photo-item");
      if (!item || e.target.closest("button")) { e.preventDefault(); return; }
      dragging = { mode: "html", id: item.closest("[data-product-photos]").dataset.productPhotos,
        from: Number(item.dataset.photoIndex) };
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", `${dragging.id}:${dragging.from}`);
      item.classList.add("is-dragging");
    });
    listen("dragover", e => {
      if (dragging?.mode !== "html") return;
      const target = locate(e.clientX, e.clientY, dragging.id);
      if (!target) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      mark(target);
    });
    listen("drop", e => {
      if (dragging?.mode !== "html") return;
      e.preventDefault();
      const current = dragging;
      const target = locate(e.clientX, e.clientY, current.id);
      dragging = null;
      clearMarks();
      clearDragged();
      commit(current.id, current.from, target);
    });
    listen("dragend", () => {
      if (dragging?.mode === "html") dragging = null;
      clearMarks();
      clearDragged();
    });
    listen("keydown", e => {
      if (!e.altKey || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const item = e.target.closest?.(".admin-photo-item");
      if (!item || e.target.closest("button")) return;
      e.preventDefault();
      const id = item.closest("[data-product-photos]").dataset.productPhotos;
      const from = Number(item.dataset.photoIndex);
      const target = from + (e.key === "ArrowLeft" ? -1 : 1);
      onReorder({ id, from, target, after: e.key === "ArrowRight", focusMoved: true });
    });

    // Native HTML DnD is unreliable on phones. The grip acts as a touch/pen
    // drag handle, while the remainder of each tile stays scrollable.
    listen("pointerdown", e => {
      if (e.pointerType === "mouse" || dragging) return;
      const handle = e.target.closest?.(".admin-photo-item__handle");
      if (!handle) return;
      const item = handle.closest(".admin-photo-item");
      const id = item.closest("[data-product-photos]").dataset.productPhotos;
      const rect = item.getBoundingClientRect();
      const ghost = item.cloneNode(true);
      ghost.classList.add("admin-photo-ghost");
      Object.assign(ghost.style, { position: "fixed", left: `${e.clientX}px`, top: `${e.clientY}px`,
        width: `${rect.width}px`, margin: "0", transform: "translate(-50%, -50%)",
        pointerEvents: "none", zIndex: "10001", opacity: ".92" });
      document.body.appendChild(ghost);
      dragging = { mode: "pointer", pointerId: e.pointerId, id,
        from: Number(item.dataset.photoIndex), ghost };
      item.classList.add("is-dragging");
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    listen("pointermove", e => {
      if (dragging?.mode !== "pointer" || dragging.pointerId !== e.pointerId) return;
      dragging.ghost.style.left = `${e.clientX}px`;
      dragging.ghost.style.top = `${e.clientY}px`;
      mark(locate(e.clientX, e.clientY, dragging.id));
      e.preventDefault();
    });
    const finishPointer = (e, shouldCommit) => {
      if (dragging?.mode !== "pointer" || dragging.pointerId !== e.pointerId) return;
      const current = dragging;
      const target = shouldCommit ? locate(e.clientX, e.clientY, current.id) : null;
      dragging = null;
      current.ghost.remove();
      clearMarks();
      clearDragged();
      commit(current.id, current.from, target);
    };
    listen("pointerup", e => finishPointer(e, true));
    listen("pointercancel", e => finishPointer(e, false));

    return () => {
      eventHandlers.forEach(([type, handler]) => container.removeEventListener(type, handler));
      if (dragging?.ghost) dragging.ghost.remove();
      dragging = null;
      clearMarks();
      clearDragged();
    };
  }

  const api = { moveImages, mount };
  root.AstelPhotoGallery = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
