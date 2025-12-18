// assets/js/pages/admin.js
import { renderAdminContentManager } from "../components/adminContent.js";
import { renderAdminProductsManager } from "../components/adminProducts.js";
import { renderAdminSponsorsManager } from "../components/adminSponsors.js";

const ADMIN_PASSWORD = "milgraus2024";

function createPageUrl(name) {
  if (name === "Home") return "index.html";
  if (name === "Shop") return "shop.html";
  return name.toLowerCase() + ".html";
}

function isAuthenticated() {
  return localStorage.getItem("admin_auth") === "true";
}

function setAuthenticated(auth) {
  if (auth) {
    localStorage.setItem("admin_auth", "true");
  } else {
    localStorage.removeItem("admin_auth");
  }
}

function renderLogin(root) {
  root.innerHTML = `
    <div class="admin-login-wrapper">
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-icon">🔐</div>
          <h1 class="admin-card-title">Área Administrativa</h1>
          <p class="admin-card-sub">Digite a senha para acessar</p>
        </div>
        <form id="admin-login-form">
          <div class="admin-form-group">
            <input
              id="admin-password"
              type="password"
              placeholder="Senha"
              class="admin-input"
            />
            <button type="button" id="admin-toggle-visibility" class="admin-toggle-btn">
              👁
            </button>
          </div>
          <p id="admin-error" class="admin-error" style="display:none"></p>
          <button type="submit" class="admin-btn-primary">Entrar</button>
          <a href="${createPageUrl("Home")}">
            <button type="button" class="admin-btn-ghost">
              ← Voltar ao Site
            </button>
          </a>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById("admin-login-form");
  const passwordInput = document.getElementById("admin-password");
  const errorEl = document.getElementById("admin-error");
  const toggleBtn = document.getElementById("admin-toggle-visibility");

  let showPassword = false;

  toggleBtn.addEventListener("click", () => {
    showPassword = !showPassword;
    passwordInput.type = showPassword ? "text" : "password";
    toggleBtn.textContent = showPassword ? "🙈" : "👁";
  });

  form.addEventListener("submit", evt => {
    evt.preventDefault();
    const value = passwordInput.value || "";
    if (value === ADMIN_PASSWORD) {
      setAuthenticated(true);
      errorEl.style.display = "none";
      renderAdminPanel(root);
    } else {
      errorEl.textContent = "Senha incorreta";
      errorEl.style.display = "block";
    }
  });
}

function renderAdminPanel(root) {
  root.innerHTML = `
    <div class="admin-panel-wrapper">
      <div class="admin-panel-inner">
        <header class="admin-header">
          <div>
            <h1 class="admin-header-title">Painel Administrativo</h1>
            <p class="admin-header-sub">Gerencie o conteúdo do site</p>
          </div>
          <div class="admin-header-actions">
            <a href="${createPageUrl("Home")}">
              <button class="admin-btn-outline">
                ← <span>Ver Site</span>
              </button>
            </a>
            <button id="admin-logout-btn" class="admin-btn-outline admin-btn-outline-danger">
              Sair
            </button>
          </div>
        </header>

        <div>
          <div class="admin-tabs-list">
            <button class="admin-tab-btn admin-tab-btn-active" data-tab="content">Conteúdo</button>
            <button class="admin-tab-btn" data-tab="products">Produtos</button>
            <button class="admin-tab-btn" data-tab="sponsors">Patrocinadores</button>
          </div>

          <div class="admin-tabs-content">
            <div data-tab-panel="content">
              <div class="admin-card" id="admin-content-panel">
                <!-- preenchido via JS -->
              </div>
            </div>

            <div data-tab-panel="products" style="display:none">
              <div class="admin-card" id="admin-products-panel"></div>
            </div>

            <div data-tab-panel="sponsors" style="display:none">
              <div class="admin-card" id="admin-sponsors-panel"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // inicializar managers
  const contentPanel = root.querySelector("#admin-content-panel");
  if (contentPanel) renderAdminContentManager(contentPanel);

  const productsPanel = root.querySelector("#admin-products-panel");
  if (productsPanel) renderAdminProductsManager(productsPanel);

  const sponsorsPanel = root.querySelector("#admin-sponsors-panel");
  if (sponsorsPanel) renderAdminSponsorsManager(sponsorsPanel);

  // logout
  const logoutBtn = document.getElementById("admin-logout-btn");
  logoutBtn.addEventListener("click", () => {
    setAuthenticated(false);
    renderLogin(root);
  });

  // tabs
  const tabButtons = root.querySelectorAll("[data-tab]");
  const tabPanels = root.querySelectorAll("[data-tab-panel]");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");

      tabButtons.forEach(b => b.classList.remove("admin-tab-btn-active"));
      btn.classList.add("admin-tab-btn-active");

      tabPanels.forEach(panel => {
        panel.style.display =
          panel.getAttribute("data-tab-panel") === tab ? "block" : "none";
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("admin-root");
  if (!root) return;

  if (isAuthenticated()) {
    renderAdminPanel(root);
  } else {
    renderLogin(root);
  }
});
