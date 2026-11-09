// js/cart.js
const CART_STORAGE_KEY = "astelkom_cart";

// The 6 products allowed to be ordered from 1 pc ("Оптом і в роздріб")
const RETAIL_ALLOWED_IDS = new Set([
  "com-900-itr-rev-b",
  "battery-iwl220",
  "battery-move-2500",
  "cable-dc-2-1x5-5-angled",
  "cable-dc-1-4x3-4-angled",
  "cable-dc-2-1x5-5-straight-filter",
]);

const CartManager = {
  getMinQty(productOrId) {
    const id = typeof productOrId === "string" ? productOrId : productOrId?.id;
    if (!id) return 1;
    if (RETAIL_ALLOWED_IDS.has(id)) return 1;

    // Also check PRODUCTS_DATA if available
    if (
      typeof PRODUCTS_DATA !== "undefined" &&
      PRODUCTS_DATA[id] &&
      PRODUCTS_DATA[id].saleTerms === "Оптом і в роздріб"
    ) {
      return 1;
    }

    return 10;
  },

  getCart() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      const items = raw ? JSON.parse(raw) : [];
      // Ensure any existing items in localStorage respect their minQty
      return items.map((item) => {
        const minQty = this.getMinQty(item.id);
        return {
          ...item,
          minQty,
          qty: Math.max(minQty, item.qty || minQty),
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
    const cart = this.getCart();
    const existing = cart.find((item) => item.id === product.id);
    const numericPrice = product.numericPrice || this.parsePrice(product.price);
    const minQty = this.getMinQty(product);

    if (existing) {
      // If already in cart, add 1 (or requestedQty)
      const increment = requestedQty ? requestedQty : 1;
      existing.qty = Math.max(minQty, existing.qty + increment);
    } else {
      // First time adding to cart: start at minQty (10 for wholesale, 1 for retail)
      const initialQty = requestedQty ? Math.max(minQty, requestedQty) : minQty;
      cart.push({
        id: product.id,
        title: product.title,
        price: numericPrice,
        image: product.image,
        minQty: minQty,
        qty: initialQty,
      });
    }

    this.saveCart(cart);
    this.showToast(
      `Додано в кошик: ${product.title} (${existing ? "+1" : minQty + " шт."})`,
    );
  },

  updateQty(id, newQty) {
    const cart = this.getCart();
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    const minQty = this.getMinQty(id);
    // Block setting quantity below minQty (10 or 1)
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
          color: #ffffff;
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
        color: #ffffff;
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
      <span>${message}</span>
      <a href="cart.html" style="font-family: var(--font-mono, monospace); font-weight: 700; text-decoration: underline; color: #ffffff; white-space: nowrap;">Оформити</a>
    `;
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
