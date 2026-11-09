// js/cart.js
const CART_STORAGE_KEY = "astelkom_cart";

const CartManager = {
  getCart() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
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

  addItem(product, qty = 1) {
    if (!product || !product.id) return;
    const cart = this.getCart();
    const existing = cart.find((item) => item.id === product.id);
    const numericPrice = product.numericPrice || this.parsePrice(product.price);

    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: numericPrice,
        image: product.image,
        qty: qty,
      });
    }

    this.saveCart(cart);
    this.showToast(`Додано в кошик: ${product.title}`);
  },

  updateQty(id, newQty) {
    let cart = this.getCart();
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    if (newQty <= 0) {
      cart = cart.filter((i) => i.id !== id);
    } else {
      item.qty = newQty;
    }
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
