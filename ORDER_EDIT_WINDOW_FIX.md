# Order editing window / admin queue (localStorage prototype)

Orders are **not available to the manager** during the customer's original 15-minute editing window.

- Checkout writes `astelkom_active_order` with an unchanged `createdAt`/`expiresAt` when the customer edits.
- Switching tabs, navigating away, or closing the order-status page no longer finalizes the order.
- Clicking **«Все вірно, передати в роботу зараз»** releases the order immediately.
- Once `expiresAt` passes, the admin dashboard treats the order as released even if the customer has closed the page. The customer status page also finalizes it when visited.
- Admin order lists, search results, order counters, and order-derived KPIs exclude editable orders, including any history entries copied during the editing window.
- Admin refreshes for other-tab changes and while open (1-second readiness check), including when the tab becomes visible again.
- Demo orders no longer overwrite `astelkom_active_order`.
- The checkout edit form rejects attempts to save a stale order after the deadline; it cannot reset the editing window.

Shared timing logic lives in `js/order-lifecycle.js`; both Ukrainian and generated English customer pages load it.

## Tests

Run from the project root:

```sh
node tests/order-lifecycle.test.js
node tests/admin-safety.test.js
node tests/cart-rules.test.js
node tests/catalog-overrides.test.js
node tests/localization.test.js
node tests/layout.test.js
node tests/theme.test.js
```

**Production note:** This is still a single-browser `localStorage` prototype. It doesn't share orders between independent devices or enforce security. In a real backend, the server must control the editing deadline, order visibility, and transitions atomically; it must not trust browser timestamps or a client-set `locked` flag.
