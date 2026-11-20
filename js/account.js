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

  function login(email, extra = {}) {
    const existing = getUser();
    const defaultProfile = {
      firstName: extra.firstName || (existing && existing.firstName) || "Ім'я",
      lastName: extra.lastName || (existing && existing.lastName) || "Прізвище",
      email: email || (existing && existing.email) || "example@gmail.com",
      phone: extra.phone || (existing && existing.phone) || "+380501234567",
      authMethod: extra.authMethod || "E-mail",
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
        localStorage.setItem(ORDERS_KEY, JSON.stringify(DEFAULT_DEMO_ORDERS));
      }
    } catch (e) {}
  }

  function getOrders() {
    ensureOrdersSeeded();
    const list = [];
    try {
      const activeRaw = localStorage.getItem("astelkom_active_order");
      if (activeRaw) {
        const activeOrder = JSON.parse(activeRaw);
        list.push({
          ...activeOrder,
          status: activeOrder.locked
            ? "Передано в обробку"
            : "Прийнято (редагування)",
          statusCode: activeOrder.locked ? "processing" : "active",
        });
      }
    } catch (e) {}

    try {
      const completed = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      completed.forEach((ord) => {
        if (!list.some((o) => o.orderId === ord.orderId)) {
          list.push({
            ...ord,
            status: ord.status || "Виконано",
            statusCode: ord.statusCode || "completed",
          });
        }
      });
    } catch (e) {}

    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
    login,
    logout,
    getOrders,
    copyOrderToCart,
    syncHeaderAccountLinks,
  };
})();
