// js/cart.js
const CART_STORAGE_KEY = "astelkom_cart";

// Minimum quantities are product metadata, not translated UI strings.
// Cart items retain minQty so the cart badge still works on pages that do not
// load the full product catalog (and for carts saved before this change).
const CartManager = {
  getMinQty(productOrId) {
    const id = typeof productOrId === "string" ? productOrId : productOrId?.id;
    if (!id) return 1;

    const catalogProduct =
      typeof PRODUCTS_DATA !== "undefined" ? PRODUCTS_DATA[id] : null;
    const fallback = typeof productOrId === "object" ? productOrId : null;
    const configuredMin = Number(
      catalogProduct?.minOrderQty ?? fallback?.minOrderQty ?? fallback?.minQty,
    );
    return Number.isInteger(configuredMin) && configuredMin > 0
      ? configuredMin
      : 10; // Legacy wholesale default if an item has no explicit policy.
  },

  getCart() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      const items = raw ? JSON.parse(raw) : [];
      // Ensure any existing items in localStorage respect their minQty
      return items.map((item) => {
        const minQty = this.getMinQty(item);
        const quantity = Number.parseInt(item.qty, 10);
        const catalogProduct =
          typeof PRODUCTS_DATA !== "undefined" ? PRODUCTS_DATA[item.id] : null;
        return {
          ...item,
          // Display current catalog price instead of stale saved cart price.
          price: catalogProduct?.numericPrice ?? item.price,
          image: catalogProduct?.image ?? item.image,
          title: catalogProduct?.title ?? item.title,
          inStock: catalogProduct?.inStock ?? item.inStock ?? true,
          minQty,
          qty: Math.max(minQty, Number.isFinite(quantity) ? quantity : minQty),
        };
      });
    } catch (e) {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    this.updateHeaderBadges();
  },

  parsePrice(priceStr) {
    if (typeof priceStr === "number") return priceStr;
    const digits = String(priceStr).replace(/[^\d]/g, "");
    return parseInt(digits, 10) || 0;
  },

  formatPrice(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₴";
  },

  addItem(product, requestedQty) {
    if (!product || !product.id) return;

    // Prevent out-of-stock products from being added to the cart
    const catalogProduct =
      typeof PRODUCTS_DATA !== "undefined" ? PRODUCTS_DATA[product.id] : null;

    if (catalogProduct?.inStock === false || (!catalogProduct && product.inStock === false)) {
      this.showToast("Товару немає в наявності");
      return;
    }

    const cart = this.getCart();
    const existing = cart.find((item) => item.id === product.id);
    const numericPrice = catalogProduct?.numericPrice ?? product.numericPrice ?? this.parsePrice(product.price);
    const minQty = this.getMinQty(product);

    if (existing) {
      existing.price = numericPrice;
      existing.inStock = catalogProduct?.inStock ?? product.inStock ?? true;
      // If already in cart, add 1 (or requestedQty)
      const increment = requestedQty ? requestedQty : 1;
      existing.qty = Math.max(minQty, existing.qty + increment);
    } else {
      // First time adding to cart: start at minQty
      const initialQty = requestedQty ? Math.max(minQty, requestedQty) : minQty;
      cart.push({
        id: product.id,
        title: product.title,
        price: numericPrice,
        inStock: catalogProduct?.inStock ?? product.inStock ?? true,
        image: product.image,
        minQty: minQty,
        qty: initialQty,
      });
    }

    const addedCount = existing
      ? requestedQty || 1
      : requestedQty
        ? Math.max(minQty, requestedQty)
        : minQty;

    this.saveCart(cart);
    this.showToast(`Додано в кошик: ${product.title} (+${addedCount} шт.)`);
  },

  updateQty(id, newQty) {
    const cart = this.getCart();
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    const minQty = this.getMinQty(item);
    // Block setting quantity below the product's configured minimum.
    item.qty = Math.max(minQty, parseInt(newQty, 10) || minQty);
    this.saveCart(cart);
  },

  removeItem(id) {
    const cart = this.getCart().filter((i) => i.id !== id);
    this.saveCart(cart);
  },

  clearCart() {
    this.saveCart([]);
  },

  getTotalCount() {
    return this.getCart().reduce((sum, item) => sum + item.qty, 0);
  },

  getSubtotal() {
    return this.getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
  },

  updateHeaderBadges() {
    const count = this.getTotalCount();
    const cartLinks = document.querySelectorAll(".header__cart");

    cartLinks.forEach((link) => {
      link.setAttribute("href", "cart.html");
      link.style.position = "relative";

      let badge = link.querySelector(".header__cart-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "header__cart-badge";
        badge.style.cssText = `
          position: absolute;
          top: -6px;
          right: -8px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          background-color: var(--gray-900, #161617);
          color: var(--gray-100, #ffffff);
          border-radius: 999px;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        `;
        link.appendChild(badge);
      }

      if (count > 0) {
        badge.textContent = count;
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    });
  },

  showToast(message) {
    let toast = document.getElementById("cart-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "cart-toast";
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background-color: var(--gray-900, #161617);
        color: var(--gray-100, #ffffff);
        padding: 14px 24px;
        border-radius: 12px;
        font-family: var(--font-base, sans-serif);
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease, transform 0.25s ease;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 90vw;
      `;
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <span></span>
      <a href="cart.html" style="font-family: var(--font-mono, monospace); font-weight: 700; text-decoration: underline; color: inherit; white-space: nowrap;">Оформити</a>
    `;
    toast.querySelector("span").textContent = message;
    toast.style.pointerEvents = "auto";
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.pointerEvents = "none";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 3200);
  },
};

document.addEventListener("DOMContentLoaded", () => {
  CartManager.updateHeaderBadges();
});
