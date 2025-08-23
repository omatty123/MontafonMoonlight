/* assets/theme.js — site-wide theme controller */
(function () {
  const STORAGE_KEY = "theme";
  const root = document.documentElement;

  // Helpers
  const apply = (mode) => {
    if (mode === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme"); // light is default
  };
  const current = () =>
    localStorage.getItem(STORAGE_KEY) ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  // Initial paint
  apply(current());

  // Wire any button that looks like a theme toggle
  const wire = (btn) => {
    if (!btn || btn.__wired) return;
    btn.__wired = true;
    btn.addEventListener("click", () => {
      const next = current() === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      apply(next);
    });
  };

  // Support either id="theme-toggle" or data-theme-toggle on the button
  const tryWire = () => {
    wire(document.querySelector("#theme-toggle") || document.querySelector("[data-theme-toggle]"));
  };

  // Run now, and again after DOM ready in case header loads late
  tryWire();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryWire, { once: true });
  } else {
    tryWire();
  }
})();
