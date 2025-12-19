// assets/js/pages/shop.js
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { getContactContent } from "../utils/siteContent.js";
import { getPriceNumber, formatCurrency, formatWhatsAppLink } from "../utils/format.js";

import { db } from "../firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const CATEGORY_LABELS = {
  all: "Todos",
  roupas: "Roupas",
  acessorios: "Acessórios",
  canecas: "Canecas",
  outros: "Outros",
};

const DEFAULT_WHATSAPP = "5561981988735";

function renderHero(root) {
  root.insertAdjacentHTML(
    "beforeend",
    `
    <section class="shop-hero">
      <div class="shop-hero-bg-1"></div>
      <div class="shop-hero-bg-2"></div>
      <div class="shop-hero-inner">
        <div class="shop-hero-badge">
          <span>🛍️</span>
          <span>Loja Oficial</span>
        </div>
        <h1 class="shop-hero-title">
          Produtos<span>Mil Graus</span>
        </h1>
        <p class="shop-hero-text">
          Garanta já os produtos oficiais da página mais quente de Samambaia!
        </p>
      </div>
    </section>
  `
  );
}

function renderFilters(root, selectedCategory) {
  const filtersHtml = Object.entries(CATEGORY_LABELS)
    .map(
      ([key, label]) => `
      <button
        class="shop-tab ${key === selectedCategory ? "shop-tab-active" : ""}"
        data-category="${key}"
      >
        ${label}
      </button>
    `
    )
    .join("");

  root.insertAdjacentHTML(
    "beforeend",
    `
    <section class="shop-filters">
      <div class="shop-filters-inner">
        <span class="shop-filters-label">🎛️ Filtros:</span>
        <div class="shop-tabs">
          ${filtersHtml}
        </div>
      </div>
    </section>
  `
  );
}

function renderProducts(root, products, selectedCategory, whatsappNumber) {
  const section = document.createElement("section");
  section.className = "shop-products";

  const inner = document.createElement("div");
  inner.className = "shop-products-inner";

  const activeProducts = products.filter((p) => p.active !== false);
  const filtered =
    selectedCategory === "all"
      ? activeProducts
      : activeProducts.filter((p) => p.category === selectedCategory);

  if (filtered.length === 0) {
    inner.innerHTML = `
      <div class="shop-empty">
        <div class="shop-empty-icon">📦</div>
        <p>
          ${
            selectedCategory === "all"
              ? "Nenhum produto disponível no momento."
              : `Nenhum produto na categoria "${CATEGORY_LABELS[selectedCategory]}".`
          }
        </p>
      </div>
    `;
  } else {
    const cardsHtml = filtered
      .map((p) => {
        const priceNumber = getPriceNumber(p.price);
        const priceText = formatCurrency(priceNumber);
        const waLink = formatWhatsAppLink(
          whatsappNumber,
          `Olá! Tenho interesse no produto: ${p.name} no valor de ${priceText}`
        );

        return `
        <article class="shop-card">
          <div class="shop-card-image-wrap">
            <img src="${p.image_url}" alt="${p.name}">
            <div class="shop-card-overlay"></div>
            <div class="shop-card-price">${priceText}</div>
            ${
              p.category
                ? `<div class="shop-card-category">${
                    CATEGORY_LABELS[p.category] || p.category
                  }</div>`
                : ""
            }
          </div>
          <div class="shop-card-body">
            <h3 class="shop-card-title">${p.name}</h3>
            <p class="shop-card-text">${p.description || ""}</p>
            <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="shop-card-btn">
              <span>💬</span>
              <span>Comprar pelo WhatsApp</span>
            </a>
          </div>
        </article>
      `;
      })
      .join("");

    inner.innerHTML = `
      <div class="shop-grid">
        ${cardsHtml}
      </div>
      <p class="shop-count">
        Mostrando ${filtered.length} ${
      filtered.length === 1 ? "produto" : "produtos"
    }${
      selectedCategory !== "all"
        ? ` em "${CATEGORY_LABELS[selectedCategory]}"`
        : ""
    }.
      </p>
    `;
  }

  section.appendChild(inner);
  root.appendChild(section);
}

async function loadProductsFromFirestore() {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

document.addEventListener("DOMContentLoaded", async () => {
  renderNavbar("navbar-root");

  const root = document.getElementById("shop-root");
  if (!root) return;

  const contact = getContactContent();
  const whatsappNumber = contact.whatsapp || DEFAULT_WHATSAPP;

  let selectedCategory = "all";

  let products = [];
  try {
    products = await loadProductsFromFirestore();
    console.log("[SHOP] Produtos do Firestore:", products);
  } catch (err) {
    console.error("Erro ao carregar produtos da loja:", err);
    products = [];
  }

  renderHero(root);
  renderFilters(root, selectedCategory);
  renderProducts(root, products, selectedCategory, whatsappNumber);
  renderFooter("footer-root");

  const filtersSection = document.querySelector(".shop-filters");
  filtersSection.addEventListener("click", (evt) => {
    const btn = evt.target.closest("[data-category]");
    if (!btn) return;
    const newCategory = btn.getAttribute("data-category");
    if (newCategory === selectedCategory) return;
    selectedCategory = newCategory;

    filtersSection
      .querySelectorAll("[data-category]")
      .forEach((el) => el.classList.remove("shop-tab-active"));
    btn.classList.add("shop-tab-active");

    const productsSection = document.querySelector(".shop-products");
    if (productsSection) productsSection.remove();
    renderProducts(root, products, selectedCategory, whatsappNumber);
  });
});
