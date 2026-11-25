/* Customer statuses, internal notes, and order-history grouping.
 * Prototype data stays in the same browser's localStorage until a backend exists.
 * Do not use these client-side flags to enforce real purchasing restrictions. */
"use strict";

const AdminCustomers = (() => {
  const STORAGE_KEY = "astelkom_admin_customer_profiles";
  const STATUSES = Object.freeze({
    normal: "Звичайний",
    attention: "Проблемний клієнт",
    restricted: "Обмежений",
  });
  const MAX_NOTE = 1000;
  const activity = () => typeof AstelAdminActivity !== "undefined" ? AstelAdminActivity : null;

  function keyFor(customer) {
    const email = String(customer?.email || "").trim().toLowerCase();
    if (email && email !== "—") return `email:${email}`;
    const phone = String(customer?.phone || "").replace(/[^\d]/g, "");
    if (phone.length >= 9) return `phone:${phone}`;
    return "";
  }

  function read(storage) {
    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed : {};
    } catch (_) { return {}; }
  }

  function cleanNotes(notes) {
    return Array.isArray(notes)
      ? notes.filter((n) => n && typeof n.text === "string")
        .map((n) => ({
          id: String(n.id || ""),
          text: n.text.slice(0, MAX_NOTE),
          createdAt: Number(n.createdAt) || 0,
          ...(typeof n.authorName === "string" && n.authorName.trim()
            ? { authorName: n.authorName.slice(0, 80), authorId: String(n.authorId || "").slice(0, 80) } : {}),
        }))
      : [];
  }

  function profileFor(profiles, key) {
    const raw = profiles[key] || {};
    // The older, customer-wide notes are preserved separately. They must not be
    // silently attributed to an order the manager never selected.
    const orderNotes = Object.create(null);
    if (raw.orderNotes && typeof raw.orderNotes === "object" && !Array.isArray(raw.orderNotes)) {
      for (const [orderId, notes] of Object.entries(raw.orderNotes)) {
        if (orderId && orderId.length <= 100) orderNotes[orderId] = cleanNotes(notes);
      }
    }
    return {
      status: Object.hasOwn(STATUSES, raw.status) ? raw.status : "normal",
      notes: cleanNotes(raw.notes),
      orderNotes,
    };
  }

  function toggleAttention(storage, key) {
    const current = profileFor(read(storage), key).status;
    return setStatus(storage, key, current === "normal" ? "attention" : "normal");
  }

  function assertCustomerOrder(orderId, knownOrderIds) {
    const id = String(orderId || "").trim();
    if (!id || id.length > 100 || !Array.isArray(knownOrderIds) ||
        !knownOrderIds.some((item) => String(item) === id)) {
      throw new Error("Оберіть замовлення цього клієнта для примітки.");
    }
    return id;
  }

  function notesForOrder(profile, orderId) {
    return profile.orderNotes[String(orderId)] || [];
  }

  function countOrderNotes(profile, knownOrderIds) {
    return knownOrderIds.reduce((total, id) => total + notesForOrder(profile, id).length, 0);
  }

  function addOrderNote(storage, key, orderId, text, knownOrderIds, timestamp = Date.now()) {
    const id = assertCustomerOrder(orderId, knownOrderIds);
    const clean = String(text || "").trim();
    if (!clean) throw new Error("Напишіть примітку перед збереженням.");
    if (clean.length > MAX_NOTE)
      throw new Error(`Примітка не може перевищувати ${MAX_NOTE} символів.`);
    const profile = profileFor(read(storage), key);
    const who = activity()?.actor();
    const note = { id: `${timestamp}-${Math.random().toString(36).slice(2, 10)}`,
      text: clean, createdAt: timestamp,
      ...(who ? { authorName: who.name, authorId: who.id } : {}) };
    profile.orderNotes[id] = [note, ...notesForOrder(profile, id)];
    const result = write(storage, key, profile);
    activity()?.record({ type: "note", action: "note.added", entityType: "order", entityId: id,
      summary: "Додано внутрішню примітку", detail: clean.slice(0, 180) });
    return result;
  }

  function deleteOrderNote(storage, key, orderId, noteId, knownOrderIds) {
    const id = assertCustomerOrder(orderId, knownOrderIds);
    const profile = profileFor(read(storage), key);
    const removed = notesForOrder(profile, id).find((note) => note.id === noteId);
    profile.orderNotes[id] = notesForOrder(profile, id).filter((note) => note.id !== noteId);
    const result = write(storage, key, profile);
    if (removed) activity()?.record({ type: "note", action: "note.deleted", entityType: "order", entityId: id,
      summary: "Видалено внутрішню примітку", detail: removed.text.slice(0, 180) });
    return result;
  }

  function assignLegacyNote(storage, key, noteId, orderId, knownOrderIds) {
    const id = assertCustomerOrder(orderId, knownOrderIds);
    const profile = profileFor(read(storage), key);
    const note = profile.notes.find((item) => item.id === noteId);
    if (!note) throw new Error("Примітку не знайдено.");
    profile.orderNotes[id] = [note, ...notesForOrder(profile, id)];
    profile.notes = profile.notes.filter((item) => item.id !== noteId);
    const result = write(storage, key, profile);
    activity()?.record({ type: "note", action: "note.assigned", entityType: "order", entityId: id,
      summary: "Примітку прив’язано до замовлення", detail: note.text.slice(0, 180) });
    return result;
  }

  function write(storage, key, next) {
    if (!key) throw new Error("Не вдалося визначити клієнта.");
    const profiles = read(storage);
    profiles[key] = next;
    storage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    return next;
  }

  function setStatus(storage, key, status) {
    if (!Object.hasOwn(STATUSES, status))
      throw new Error("Невідомий статус клієнта.");
    const profile = profileFor(read(storage), key);
    const result = write(storage, key, { ...profile, status });
    if (profile.status !== status) activity()?.record({
      type: "customer", action: "customer.status", entityType: "customer", entityId: key,
      summary: "Змінено позначку клієнта", detail: `${STATUSES[profile.status]} → ${STATUSES[status]}`,
    });
    return result;
  }

  function addNote(storage, key, text, timestamp = Date.now()) {
    const clean = String(text || "").trim();
    if (!clean) throw new Error("Напишіть примітку перед збереженням.");
    if (clean.length > MAX_NOTE)
      throw new Error(`Примітка не може перевищувати ${MAX_NOTE} символів.`);
    const profile = profileFor(read(storage), key);
    // Monotonic enough for an in-browser prototype, without relying on crypto APIs.
    const id = `${timestamp}-${Math.random().toString(36).slice(2, 10)}`;
    profile.notes.unshift({ id, text: clean, createdAt: timestamp });
    return write(storage, key, profile);
  }

  function deleteNote(storage, key, id) {
    const profile = profileFor(read(storage), key);
    profile.notes = profile.notes.filter((note) => note.id !== id);
    return write(storage, key, profile);
  }

  function buildClients(orders, account) {
    const clients = new Map();
    function ensure(customer, delivery) {
      const key = keyFor(customer);
      if (!key) return null;
      if (!clients.has(key)) clients.set(key, {
        key,
        firstName: customer.firstName || "Ім'я",
        lastName: customer.lastName || "Прізвище",
        phone: customer.phone || "—",
        email: customer.email || "—",
        address: "—",
        ordersCount: 0,
        totalSpent: 0,
        orders: [],
      });
      const client = clients.get(key);
      if (delivery && client.address === "—") {
        const parts = [delivery.city && `м. ${delivery.city}`,
          delivery.carrierName, delivery.branch && `(${delivery.branch})`]
          .filter(Boolean);
        if (parts.length) client.address = parts.join(", ");
      }
      return client;
    }
    if (account) ensure(account, account.address);
    // Latest orders first, and one entry per distinct order ID.
    const unique = new Map();
    for (const order of orders || []) {
      const id = String(order.orderId || order.id || "");
      if (id && !unique.has(id)) unique.set(id, order);
    }
    for (const order of [...unique.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))) {
      const client = ensure(order.customer, order.delivery);
      if (!client) continue;
      client.orders.push(order);
      client.ordersCount++;
      if (order.statusCode !== "canceled")
        client.totalSpent += Number(order.subtotal) || 0;
    }
    return [...clients.values()];
  }
  return Object.freeze({
    STORAGE_KEY, STATUSES, MAX_NOTE, keyFor, read, profileFor,
    setStatus, toggleAttention, notesForOrder, countOrderNotes,
    addOrderNote, deleteOrderNote, assignLegacyNote,
    addNote, deleteNote, buildClients,
  });
})();

if (typeof module !== "undefined") module.exports = AdminCustomers;
