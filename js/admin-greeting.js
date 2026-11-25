/* Time-of-day greeting in the admin dashboard header. */
(() => {
  "use strict";

  const greetingElement = document.getElementById("admin-greeting");
  if (!greetingElement) return;

  const name = greetingElement.dataset.name || "Сергій";

  function updateGreeting() {
    const hour = new Date().getHours();
    let greeting;

    if (hour >= 5 && hour < 12) {
      greeting = "Добрий ранок";
    } else if (hour >= 12 && hour < 18) {
      greeting = "Добрий день";
    } else if (hour >= 18) {
      greeting = "Добрий вечір";
    } else {
      greeting = "Доброї ночі";
    }

    greetingElement.textContent = `${greeting}, ${name}!`;
  }

  updateGreeting();
  // Keep the greeting accurate if the admin panel stays open past a time boundary.
  window.setInterval(updateGreeting, 60_000);
})();
