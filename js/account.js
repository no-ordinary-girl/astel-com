/* ===========================
   AUTH & ACCOUNT MANAGER (Append to js/cart.js)
   =========================== */
const AuthManager = (function () {
  const USER_KEY = "astelkom_auth_user";
  const ORDERS_KEY = "astelkom_completed_orders";

  const DEFAULT_DEMO_ORDERS = [
    {
      orderId: "AK-849210",
      createdAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
      status: "Виконано",
      statusCode: "completed",
      ttn: "20450918273645",
      payment: "Безготівковий розрахунок (рахунок-фактура)",
      delivery: {
        city: "Київ",
        carrierKey: "nova",
        carrierName: "Нова Пошта",
        type: "Відділення",
        branch: "Відділення №15: вул. Машинобудівна, 44",
      },
      subtotal: 60128,
      items: [
        {
          id: "com-900-itr-4g",
          title:
            "GSM/LTE-модем COM-900-ITR-4G для роботи з лічильниками ITRON (ACTARIS)",
          price: 4300,
          qty: 10,
          image: "assets/images/items/СОМ-900-ITR-4G.png",
        },
        {
          id: "com-900-nbi-int",
          title: "NBIoT-модем COM-900-NBI-int для роботи з теплолічильниками",
          price: 8064,
          qty: 2,
          image: "assets/images/items/СОМ-900-NBI-int.png",
        },
        {
          id: "gsm-antenna-3dbi",
          title:
            "GSM-антена 3dBi на магнітній основі з кабелем 3 метри і роз'ємом SMA",
          price: 120,
          qty: 8,
          image: "assets/images/items/GSM-antenna-3dBi-SMA.png",
        },
      ],
    },
    {
      orderId: "AK-793045",
      createdAt: Date.now() - 38 * 24 * 60 * 60 * 1000,
      status: "Виконано",
      statusCode: "completed",
      ttn: "20450883419022",
      payment: "Оплата банківською картою",
      delivery: {
        city: "Київ",
        carrierKey: "nova",
        carrierName: "Нова Пошта",
        type: "Відділення",
        branch: "Відділення №15: вул. Машинобудівна, 44",
      },
      subtotal: 43000,
      items: [
        {
          id: "com-900-485",
          title: "Універсальний GSM/GPRS-модем COM-900/485",
          price: 4300,
          qty: 10,
          image: "assets/images/items/СОМ-900-485.png",
        },
      ],
    },
  ];

  function getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function isLoggedIn() {
    return Boolean(getUser());
  }

  function saveUser(userData) {
    const current = getUser() || {};
    const updated = { ...current, ...userData };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    syncHeaderAccountLinks();
    return updated;
  }

  // After saving a change to the customer's own order, synchronize ONLY the
  // changed fields. Unchanged order fields never overwrite newer profile data.
  // Order records themselves retain their historical delivery/payment snapshots.
  function syncProfileFromEditedOrder(previousOrder, updatedOrder) {
    const user = getUser();
    const previousCustomer = previousOrder && previousOrder.customer;
    const updatedCustomer = updatedOrder && updatedOrder.customer;
    const previousEmail = String(previousCustomer?.email || "").trim().toLowerCase();
    const accountEmail = String(user?.email || "").trim().toLowerCase();

    if (
      !user || !previousCustomer || !updatedCustomer ||
      !previousOrder.orderId ||
      String(previousOrder.orderId) !== String(updatedOrder.orderId) ||
      !previousEmail || previousEmail !== accountEmail
    ) return false;

    const changes = {};
    for (const field of ["firstName", "lastName", "phone", "email"]) {
      const before = String(previousCustomer[field] || "").trim();
      const after = String(updatedCustomer[field] || "").trim();
      if (after !== before && (field === "phone" || after)) changes[field] = after;
    }

    const addressFields = ["city", "carrierKey", "carrierName", "type", "branch"];
    const oldDelivery = previousOrder.delivery || {};
    const newDelivery = updatedOrder.delivery || {};
    const addressChanged = addressFields.some((field) =>
      String(newDelivery[field] || "").trim() !== String(oldDelivery[field] || "").trim());
    if (addressChanged && newDelivery.city && newDelivery.branch) {
      changes.address = Object.fromEntries(addressFields.map((field) =>
        [field, String(newDelivery[field] || "").trim()]));
    }

    const previousPayment = String(previousOrder.payment || "").trim();
    const updatedPayment = String(updatedOrder.payment || "").trim();
    if (updatedPayment && previousPayment !== updatedPayment &&
        updatedPayment !== user.preferredPayment) {
      changes.preferredPayment = updatedPayment;
    }

    if (!Object.keys(changes).length) return false;
    saveUser(changes);
    return true;
  }

  // A new checkout placed by the signed-in customer updates the account's
  // contact details and preferred delivery/payment for their NEXT checkout.
  // Orders keep their own immutable customer, delivery and payment snapshots.
  // Guests and accounts changed while the form was open are never updated.
  function syncProfileFromNewOrder(order, signedInEmailAtStart) {
    const user = getUser();
    const expectedEmail = String(signedInEmailAtStart || "").trim().toLowerCase();
    if (!user || !order?.customer || !order?.delivery || !expectedEmail ||
        String(user.email || "").trim().toLowerCase() !== expectedEmail) return false;

    const changes = {};
    for (const field of ["firstName", "lastName", "phone", "email"]) {
      const value = String(order.customer[field] ?? "").trim();
      if (field !== "phone" && !value) continue;
      if (value !== String(user[field] ?? "").trim()) changes[field] = value;
    }

    const address = order.delivery;
    const preferredAddress = {
      city: String(address.city || "").trim(),
      carrierKey: String(address.carrierKey || "").trim(),
      carrierName: String(address.carrierName || "").trim(),
      type: String(address.type || "").trim(),
      branch: String(address.branch || "").trim(),
    };
    if (preferredAddress.city && preferredAddress.branch &&
        Object.entries(preferredAddress).some(([key, value]) => value !== String(user.address?.[key] ?? "").trim())) {
      changes.address = preferredAddress;
    }
    const payment = String(order.payment || "").trim();
    if (payment && payment !== user.preferredPayment) changes.preferredPayment = payment;

    if (!Object.keys(changes).length) return false;
    saveUser(changes);
    return true;
  }

  function login(email, extra = {}) {
    const existing = getUser();
    const defaultProfile = {
      firstName: extra.firstName || (existing && existing.firstName) || "Ім'я",
      lastName: extra.lastName || (existing && existing.lastName) || "Прізвище",
      email: email || (existing && existing.email) || "example@gmail.com",
      phone: extra.phone || (existing && existing.phone) || "+380501234567",
      authMethod: extra.authMethod || "E-mail",
      preferredPayment: extra.preferredPayment || (existing && existing.preferredPayment) || "Готівка",
      address: (existing && existing.address) || {
        city: "Київ",
        carrierKey: "nova",
        carrierName: "Нова Пошта",
        type: "Відділення",
        branch: "Відділення №15: вул. Машинобудівна, 44",
      },
      loggedInAt: Date.now(),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(defaultProfile));
    ensureOrdersSeeded();
    syncHeaderAccountLinks();
    return defaultProfile;
  }

  function logout() {
    localStorage.removeItem(USER_KEY);
    syncHeaderAccountLinks();
  }

  function ensureOrdersSeeded() {
    try {
      if (localStorage.getItem(ORDERS_KEY) === null) {
        // Do not inject demo history into a customer's real first order.
        localStorage.setItem(
          ORDERS_KEY,
          JSON.stringify(localStorage.getItem("astelkom_active_order") ? [] : DEFAULT_DEMO_ORDERS),
        );
      }
    } catch (e) {}
  }

  function getOrders() {
    ensureOrdersSeeded();
    let stored = [];
    if (typeof OrderLifecycle !== "undefined") {
      stored = OrderLifecycle.getOrders(localStorage);
    } else {
      try {
        const archived = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
        if (Array.isArray(archived)) stored = archived;
        const active = JSON.parse(localStorage.getItem("astelkom_active_order") || "null");
        if (active && active.orderId) {
          stored = stored.filter((o) => String(o.orderId) !== String(active.orderId));
          stored.push(active);
        }
      } catch (e) {}
    }

    const now = Date.now();
    return stored.map((ord) => {
      const code = String(ord.statusCode || "");
      if (["shipped", "completed", "canceled"].includes(code)) {
        return { ...ord, statusCode: code };
      }
      // Old archived orders may still be in their 15-minute editing window.
      // Determine their current state from their own deadline, not from whether
      // they happen to be the latest order.
      const expiry = Number(ord.expiresAt);
      if (Number.isFinite(expiry) && expiry > 0) {
        const editable = ord.locked !== true && expiry > now;
        return {
          ...ord,
          statusCode: editable ? "active" : "processing",
          status: editable ? "Оформлено (редагування)" : "Передано в обробку",
        };
      }
      return { ...ord, statusCode: code || "completed", status: ord.status || "Виконано" };
    }).sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
  }

  function copyOrderToCart(orderId) {
    const orders = getOrders();
    const target = orderId
      ? orders.find((o) => o.orderId === orderId)
      : orders[0];

    if (!target || !target.items || target.items.length === 0) return false;

    if (typeof CartManager !== "undefined") {
      // Очищаємо кошик перед повтором або додаємо позиції з точною кількістю замовлення
      CartManager.clearCart();
      target.items.forEach((item) => {
        CartManager.addItem(
          {
            id: item.id,
            title: item.title,
            price: item.price,
            image: item.image,
          },
          item.qty,
        );
      });
    }

    // Зберігаємо дані замовлення (доставку, оплату, контакти) для автозаповнення в cart.html
    localStorage.setItem("astelkom_repeat_order", JSON.stringify(target));
    return target;
  }

  function syncHeaderAccountLinks() {
    const loggedIn = isLoggedIn();
    const user = getUser();
    const targetHref = loggedIn ? "account.html" : "login.html";
    const targetTitle = loggedIn
      ? `Особистий кабінет (${user.firstName} ${user.lastName})`
      : "Увійти в особистий кабінет";

    // Auto-inject account icon next to mobile & desktop cart icons if not already in DOM
    const topControls = document.querySelector(".header__top-controls");
    const mobileCart = document.querySelector(".header__cart--mobile");
    if (
      topControls &&
      mobileCart &&
      !topControls.querySelector(".header__account--mobile")
    ) {
      const a = document.createElement("a");
      a.className = "header__account header__account--mobile";
      a.setAttribute("data-account-link", "");
      a.innerHTML = `<img src="assets/images/account.svg" class="account-icon-black" alt="Кабінет" />`;
      topControls.insertBefore(a, mobileCart);
    }

    const utils = document.querySelector(".header__utils");
    const desktopCart = document.querySelector(".header__cart--desktop");
    if (
      utils &&
      desktopCart &&
      !utils.querySelector(".header__account--desktop")
    ) {
      const a = document.createElement("a");
      a.className = "header__account header__account--desktop";
      a.setAttribute("data-account-link", "");
      a.innerHTML = `<img src="assets/images/account.svg" class="account-icon-black" alt="Кабінет" />`;
      utils.insertBefore(a, desktopCart);
    }

    document
      .querySelectorAll("[data-account-link], .header__account")
      .forEach((link) => {
        link.setAttribute("href", targetHref);
        link.setAttribute("title", targetTitle);
        link.setAttribute("aria-label", targetTitle);
        link.classList.toggle("is-logged-in", loggedIn);
      });
  }

  document.addEventListener("DOMContentLoaded", syncHeaderAccountLinks);

  return {
    getUser,
    isLoggedIn,
    saveUser,
    syncProfileFromEditedOrder,
    syncProfileFromNewOrder,
    login,
    logout,
    getOrders,
    copyOrderToCart,
    syncHeaderAccountLinks,
  };
})();
