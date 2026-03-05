const NAV_ITEMS = [
  { name: "Notícias", path: "News",   icon: "journal-richtext" },
  { name: "Loja",    path: "Shop",   icon: "bag-fill" },
  { name: "Sobre",   path: "Sobre",  icon: "person-fill" }  // ← novo nome
];

function getCurrentPageName() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  console.log("DEBUG - Página detectada:", path); // ← pra debug
  
  // Prioridade: página exata primeiro
  if (path === "index.html" || path.includes("news")) return "News";
  if (path === "home.html" || path === "sobre.html") return "Sobre";
  if (path === "shop.html") return "Shop";
  if (path.includes("admin")) return "Admin";
  
  // Fallback por nome do arquivo
  if (path.toLowerCase().includes("home") || path.toLowerCase().includes("sobre")) return "Sobre";
  if (path.toLowerCase().includes("shop")) return "Shop";
  
  return "News"; // Padrão: notícias (index.html)
}

function createPageUrl(name) {
  if (name === "News") return "index.html";      // Notícias = index.html
  if (name === "Sobre") return "home.html";      // Sobre = home.html (antiga home)
  if (name === "Shop") return "shop.html";       // Loja mantém
  return name.toLowerCase() + ".html";
}

export function renderNavbar(rootId = "navbar-root") {
  const root = document.getElementById(rootId);
  if (!root) return;

  const currentPage = getCurrentPageName();

  root.innerHTML = `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="${createPageUrl("News")}" class="navbar-logo">
          <span class="navbar-logo-smg">SMG</span>
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
                  <i class="bi bi-${item.icon} navbar-item-icon"></i>
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
                  <i class="bi bi-${item.icon} navbar-item-icon"></i>
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
