# Admin editor: delivery, payment status, and UX changes

## What changed

- **Save changes** closes the order editor and smoothly scrolls to the *same* order card (`scroll-margin-top:100px` allows space for the sticky header).
- The editor now displays each product's **unit price before quantity**.
- The entire `.admin-order-card__controls` block is absent while that order is being edited. Order editing controls remain visible.
- **City:** an autocomplete-style `<datalist>` draws names from `js/delivery-data.js`. Typing an unlisted city remains possible.
- **Branch/address:** a dependent `<select>` draws previously used addresses for matching city/carrier/type, retaining the current address. The **manual address** option covers unlisted locations. These entries are *not guaranteed to be live or currently operational*.
- If/when a trustworthy delivery-directory backend exists, set `window.ASTEL_DELIVERY_DIRECTORY_URL = '/api/delivery/branches'` **before** `js/admin.js` loads. It should accept `GET ?city=...&carrier=nova|ukr|meest&type=Відділення|Поштомат` and return `{ "branches": ["Official address 1", "Official address 2"] }`. Only same-origin endpoints are permitted. Keep carrier credentials on the server. The website currently has no such endpoint, so a real branch directory cannot yet be offered.
- **Payment state** is now **read-only**. Cash payment displays “Оплата при отриманні”; online payment displays “Очікує підтвердження оплати” unless the order has payment confirmation linked to the exact order ID, amount and currency. Old manually edited `paymentStatus:'paid'` values are deliberately not treated as proof. Changing payment method or order amount clears the existing payment-verification reference.

## LiqPay integration (not connected yet)

A real online-payment status requires a backend and a merchant account. Recommended sequence:

1. Your server creates the order and calculates/locks the payable amount in UAH.
2. The server prepares a LiqPay checkout session using server-side credentials. Never ship the private key to the browser.
3. LiqPay sends a callback to your backend (`server_url`). Verify its cryptographic signature using current official documentation, check the payment status, merchant/order ID, amount and currency, and update the order **idempotently**.
4. The admin reads that verified status from your database. An unverified browser redirect, localStorage flag, or client-side LiqPay callback must **not** mark payment “Сплачено”.
5. Handle errors, pending states, reversals/refunds, changed order amounts, and cash-on-delivery settlement separately.

The current localStorage-only deployment (including GitHub Pages) **cannot securely know whether a card payment happened**. These changes deliberately do not simulate successful payments.

## Verification

- `node tests/admin-delivery-editor.test.js`
- `node tests/admin-inventory-finance.test.js`
- Existing `tests/*.js` suites also pass.
- An isolated Chromium interaction test verified an editable order's dropdowns, hidden controls, manual address, save, and scroll behavior. This does not replace complete navigation tests on a deployed site.
