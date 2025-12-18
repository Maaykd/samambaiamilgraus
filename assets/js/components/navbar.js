// assets/js/components/navbar.js

const NAV_ITEMS = [
  { name: "Início", path: "Home", icon: "🏠" },
  { name: "Loja", path: "Shop", icon: "🛍️" }
];

function getCurrentPageName() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  if (path.toLowerCase().includes("shop")) return "Shop";
  if (path.toLowerCase().includes("admin")) return "Admin";
  return "Home";
}

function createPageUrl(name) {
  if (name === "Home") return "index.html";
  return name.toLowerCase() + ".html";
}

export function renderNavbar(rootId = "navbar-root") {
  const root = document.getElementById(rootId);
  if (!root) return;

  const currentPage = getCurrentPageName();

  root.innerHTML = `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="${createPageUrl("Home")}" class="navbar-logo">
          <span class="navbar-logo-emoji">😎</span>
          <div class="navbar-logo-text">
            <p class="navbar-logo-title">SAMAMBAIA MIL GRAUS</p>
            <p class="navbar-logo-sub">@samambaiamilgraus</p>
          </div>
        </a>

        <div class="navbar-menu">
          ${NAV_ITEMS.map(
            (item) => `
            <a href="${createPageUrl(item.path)}">
              <button class="navbar-btn ${
                currentPage === item.path
                  ? "navbar-btn-active"
                  : "navbar-btn-ghost"
              }">
                <span class="icon">${item.icon}</span>
                <span>${item.name}</span>
              </button>
            </a>
          `
          ).join("")}
        </div>

        <button class="navbar-toggle" aria-label="Abrir menu" id="navbar-toggle-btn">
          <span id="navbar-toggle-icon">☰</span>
        </button>
      </div>

      <div class="navbar-mobile" id="navbar-mobile-menu">
        <div class="navbar-mobile-inner">
          ${NAV_ITEMS.map(
            (item) => `
            <a href="${createPageUrl(item.path)}" class="navbar-mobile-link">
              <button class="navbar-btn ${
                currentPage === item.path
                  ? "navbar-btn-active"
                  : "navbar-btn-ghost"
              }" data-mobile-item>
                <span class="icon">${item.icon}</span>
                <span>${item.name}</span>
              </button>
            </a>
          `
          ).join("")}
        </div>
      </div>
    </nav>
  `;

  const toggleBtn = document.getElementById("navbar-toggle-btn");
  const toggleIcon = document.getElementById("navbar-toggle-icon");
  const mobileMenu = document.getElementById("navbar-mobile-menu");

  if (!toggleBtn || !mobileMenu) return;

  let isOpen = false;

  function setOpen(open) {
    isOpen = open;
    if (open) {
      mobileMenu.classList.add("open");
      toggleIcon.textContent = "✕";
    } else {
      mobileMenu.classList.remove("open");
      toggleIcon.textContent = "☰";
    }
  }

  toggleBtn.addEventListener("click", () => {
    setOpen(!isOpen);
  });

  mobileMenu.querySelectorAll("[data-mobile-item]").forEach((btn) => {
    btn.addEventListener("click", () => setOpen(false));
  });
}
