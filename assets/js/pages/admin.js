// assets/js/pages/admin.js
import { renderAdminContentManager } from "../components/adminContent.js";
import { renderAdminProductsManager } from "../components/adminProducts.js";
import { renderAdminSponsorsManager } from "../components/adminSponsors.js";
import { renderAdminNewsManager } from "../components/adminNews.js"; // NOVO
import { renderAdminAdsManager } from "../components/adminAds.js"; // <= NOVO
import { auth } from "../firebase.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// Helpers de navegação
function createPageUrl(name) {
  if (name === "Home") return "index.html";
  if (name === "Shop") return "shop.html";
  return name.toLowerCase() + ".html";
}

/**
 * LOGIN
 * Tela de login com email + senha usando Firebase Auth.
 * Só usuários cadastrados no console (ou futuramente via painel) conseguem entrar.
 */
function renderLogin(root) {
  root.innerHTML = `
    <div class="admin-login-wrapper">
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-icon">🔐</div>
          <h1 class="admin-card-title">Área Administrativa</h1>
          <p class="admin-card-sub">Acesse com seu e-mail e senha</p>
        </div>
        <form id="admin-login-form">
          <div class="admin-form-group">
            <input
              id="admin-email"
              type="email"
              placeholder="E-mail"
              class="admin-input"
              autocomplete="email"
              required
            />
          </div>
          <div class="admin-form-group admin-form-group-password">
            <input
              id="admin-password"
              type="password"
              placeholder="Senha"
              class="admin-input"
              autocomplete="current-password"
              required
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
  const emailInput = document.getElementById("admin-email");
  const passwordInput = document.getElementById("admin-password");
  const errorEl = document.getElementById("admin-error");
  const toggleBtn = document.getElementById("admin-toggle-visibility");

  let showPassword = false;

  toggleBtn.addEventListener("click", () => {
    showPassword = !showPassword;
    passwordInput.type = showPassword ? "text" : "password";
    toggleBtn.textContent = showPassword ? "🙈" : "👁";
  });

  form.addEventListener("submit", async (evt) => {
    evt.preventDefault();

    const email = (emailInput.value || "").trim();
    const password = passwordInput.value || "";

    if (!email || !password) {
      errorEl.textContent = "Preencha e-mail e senha.";
      errorEl.style.display = "block";
      return;
    }

    errorEl.style.display = "none";

    try {
      // Login via Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged vai disparar e chamar renderAdminPanel
    } catch (err) {
      console.error("Erro ao fazer login:", err);

      let message = "Não foi possível entrar. Verifique os dados.";
      if (err.code === "auth/invalid-email") {
        message = "E-mail inválido.";
      } else if (err.code === "auth/user-disabled") {
        message = "Usuário desativado. Fale com o administrador.";
      } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        message = "E-mail ou senha incorretos.";
      }

      errorEl.textContent = message;
      errorEl.style.display = "block";
    }
  });
}

/**
 * PAINEL ADMIN
 * Só deve ser exibido se houver usuário autenticado (controlado por onAuthStateChanged).
 */
function renderAdminPanel(root, user) {
  root.innerHTML = `
    <div class="admin-panel-wrapper">
      <div class="admin-panel-inner">
        <header class="admin-header">
          <div>
            <h1 class="admin-header-title">Painel Administrativo</h1>
            <p class="admin-header-sub">
              Gerencie o conteúdo do site
              ${user && user.email ? ` – logado como <strong>${user.email}</strong>` : ""}
            </p>
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
            <button class="admin-tab-btn" data-tab="news">Notícias</button>
            <button class="admin-tab-btn" data-tab="ads">Propagandas</button>
          </div>

          <div class="admin-tabs-content">
            <div data-tab-panel="content">
              <div class="admin-card" id="admin-content-panel"></div>
            </div>

            <div data-tab-panel="products" style="display:none">
              <div class="admin-card" id="admin-products-panel"></div>
            </div>

            <div data-tab-panel="sponsors" style="display:none">
              <div class="admin-card" id="admin-sponsors-panel"></div>
            </div>

            <div data-tab-panel="news" style="display:none">
              <div class="admin-card" id="admin-news-panel"></div>
            </div>

            <div data-tab-panel="ads" style="display:none">
              <div class="admin-card" id="admin-ads-panel"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const contentPanel = root.querySelector("#admin-content-panel");
  if (contentPanel) renderAdminContentManager(contentPanel);

  const productsPanel = root.querySelector("#admin-products-panel");
  if (productsPanel) renderAdminProductsManager(productsPanel);

  const sponsorsPanel = root.querySelector("#admin-sponsors-panel");
  if (sponsorsPanel) renderAdminSponsorsManager(sponsorsPanel);

  const newsPanel = root.querySelector("#admin-news-panel");
  if (newsPanel) renderAdminNewsManager(newsPanel);

  const adsPanel = root.querySelector("#admin-ads-panel");      // <= NOVO
  if (adsPanel) renderAdminAdsManager(adsPanel);                // <= NOVO


  // Logout
  const logoutBtn = document.getElementById("admin-logout-btn");
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged vai voltar para a tela de login
    } catch (err) {
      console.error("Erro ao sair:", err);
      alert("Não foi possível sair. Recarregue a página.");
    }
  });

  // Tabs
  const tabButtons = root.querySelectorAll("[data-tab]");
  const tabPanels = root.querySelectorAll("[data-tab-panel]");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");

      tabButtons.forEach((b) => b.classList.remove("admin-tab-btn-active"));
      btn.classList.add("admin-tab-btn-active");

      tabPanels.forEach((panel) => {
        panel.style.display =
          panel.getAttribute("data-tab-panel") === tab ? "block" : "none";
      });
    });
  });
}

/**
 * INICIALIZAÇÃO DA PÁGINA
 * Usa onAuthStateChanged para proteger a rota:
 * - Se tiver usuário logado → mostra painel
 * - Se não tiver → mostra login
 */
document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("admin-root");
  if (!root) return;

  // Estado inicial de “carregando”
  root.innerHTML = `
    <div class="admin-login-wrapper">
      <div class="admin-card">
        <p>Carregando...</p>
      </div>
    </div>
  `;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      renderAdminPanel(root, user);
    } else {
      renderLogin(root);
    }
  });
});
