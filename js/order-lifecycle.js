/* Shared order editing window (localStorage prototype). */
"use strict";

const OrderLifecycle = Object.freeze({
  EDIT_WINDOW_MS: 15 * 60 * 1000,

  // Only an unlocked order with a future deadline remains private to the customer.
  isEditable(order, now = Date.now()) {
    if (!order || order.locked === true) return false;
    const expiresAt = Number(order.expiresAt);
    return Number.isFinite(expiresAt) && expiresAt > now;
  },

  // A released order is either explicitly confirmed or past its edit deadline.
  isReleased(order, now = Date.now()) {
    return Boolean(order) && !this.isEditable(order, now);
  },

  release(order, now = Date.now()) {
    if (!order) throw new TypeError("Missing order");
    const statusCode = String(order.statusCode || "");
    if (["shipped", "completed", "canceled"].includes(statusCode)) {
      return { ...order, locked: true };
    }
    return {
      ...order,
      locked: true,
      statusCode: "processing",
      status: "Передано в обробку",
      finalizedAt: Number(order.finalizedAt) || now,
    };
  },
});

if (typeof module !== "undefined") module.exports = OrderLifecycle;
