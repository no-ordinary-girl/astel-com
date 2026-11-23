/* Shared order editing window and localStorage prototype order collection. */
"use strict";

const OrderLifecycle = Object.freeze({
  EDIT_WINDOW_MS: 15 * 60 * 1000,
  ACTIVE_KEY: "astelkom_active_order",
  HISTORY_KEY: "astelkom_completed_orders", // Historical key; may also contain editable orders.

  isEditable(order, now = Date.now()) {
    if (!order || order.locked === true) return false;
    const expiresAt = Number(order.expiresAt);
    return Number.isFinite(expiresAt) && expiresAt > now;
  },

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

  // All order IDs are independent. An active-order record is only a pointer to
  // the latest order, not the sole place where unfinished orders may exist.
  readHistory(storage = localStorage) {
    try {
      const list = JSON.parse(storage.getItem(this.HISTORY_KEY) || "[]");
      return Array.isArray(list) ? list.filter((item) => item && item.orderId) : [];
    } catch (_) {
      return [];
    }
  },

  readActive(storage = localStorage) {
    try {
      const order = JSON.parse(storage.getItem(this.ACTIVE_KEY) || "null");
      return order && order.orderId ? order : null;
    } catch (_) {
      return null;
    }
  },

  getOrders(storage = localStorage) {
    const orders = new Map();
    this.readHistory(storage).forEach((order) => orders.set(String(order.orderId), order));
    const active = this.readActive(storage);
    if (active) orders.set(String(active.orderId), active);
    return [...orders.values()].sort(
      (a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0),
    );
  },

  getOrder(orderId, storage = localStorage) {
    const requested = String(orderId || "");
    const active = this.readActive(storage);
    if (!requested) return active;
    if (active && String(active.orderId) === requested) return active;
    return this.readHistory(storage).find((order) => String(order.orderId) === requested) || null;
  },

  generateId(now = Date.now(), storage = localStorage) {
    const existing = new Set(this.getOrders(storage).map((order) => String(order.orderId)));
    // Use a longer numeric suffix than the old six-digit timestamp suffix,
    // which repeated every 16 minutes and 40 seconds.
    let suffix = Math.trunc(now) % 1_000_000_000;
    for (let attempt = 0; attempt < 1_000_000_000; attempt += 1) {
      const id = `AK-${String(suffix).padStart(9, "0")}`;
      if (!existing.has(id)) return id;
      suffix = (suffix + 1) % 1_000_000_000;
    }
    throw new Error("Unable to generate a unique order ID");
  },

  // New checkout: preserve the previous active order (and its untouched edit
  // deadline) before replacing the latest-order pointer. No order is released
  // merely because another order was placed.
  createOrder(order, storage = localStorage) {
    if (!order || !order.orderId) throw new TypeError("Missing order ID");
    if (this.getOrder(order.orderId, storage)) throw new Error("Order ID already exists");
    const previous = this.readActive(storage);
    if (previous && String(previous.orderId) !== String(order.orderId)) {
      const list = this.readHistory(storage).filter(
        (item) => String(item.orderId) !== String(previous.orderId),
      );
      list.unshift(previous);
      // Write history first. If storage is full, do not replace the active order.
      storage.setItem(this.HISTORY_KEY, JSON.stringify(list));
    }
    storage.setItem(this.ACTIVE_KEY, JSON.stringify(order));
    return order;
  },

  // Existing-order edit or confirmation: update only the matching record.
  saveOrder(order, storage = localStorage) {
    if (!order || !order.orderId) throw new TypeError("Missing order ID");
    const active = this.readActive(storage);
    if (active && String(active.orderId) === String(order.orderId)) {
      storage.setItem(this.ACTIVE_KEY, JSON.stringify(order));
      return order;
    }
    const list = this.readHistory(storage);
    const index = list.findIndex((item) => String(item.orderId) === String(order.orderId));
    if (index < 0) throw new Error("Order not found");
    list[index] = order;
    storage.setItem(this.HISTORY_KEY, JSON.stringify(list));
    return order;
  },
});

if (typeof module !== "undefined") module.exports = OrderLifecycle;
