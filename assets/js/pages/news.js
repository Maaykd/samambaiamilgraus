// assets/js/pages/news.js
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const CATEGORIES = [
  "Todas",
  "Política",
  "Economia",
  "Segurança",
  "Cultura",
  "Esportes",
  "Entretenimento",
  "Geral"
];

// mapa categoria salvo → label exibida
const CATEGORY_LABELS = {
  politica: "Política",
  economia: "Economia",
  seguranca: "Segurança",
  cultura: "Cultura",
  esportes: "Esportes",
  entretenimento: "Entretenimento",
  geral: "Geral"
};

async function fetchPublishedNews() {
  const col = collection(db, "news");
  const q = query(
    col,
    where("published", "==", true),
    orderBy("created_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const rawCat = (data.category || "geral").toString();
    const label = CATEGORY_LABELS[rawCat] || rawCat;
    return {
      id: d.id,
      ...data,
      category_raw: rawCat,
      category_label: label
    };
  });
}

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function getSelectedCategory() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("category");
  return cat || "Todas";
}

function getNewsIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// lista
async function renderNewsList(rootId) {
  const root = document.getElementById(rootId);
  if (!root) return;

  const selectedCategory = getSelectedCategory();

  let allNews = await fetchPublishedNews();

  const filtered =
    selectedCategory === "Todas"
      ? allNews
      : allNews.filter((n) => n.category_label === selectedCategory);

  const categoriesHtml = CATEGORIES.map((cat) => {
    const active = cat === selectedCategory ? "news-tab--active" : "";
    return `
      <button
        class="news-tab ${active}"
        data-category="${cat}"
      >
        ${cat}
      </button>
    `;
  }).join("");

  const [featured, ...rest] = filtered;

  const featuredHtml = featured
    ? `
      <article class="news-card news-card--featured" data-id="${featured.id}">
        <div class="news-card__image-wrapper">
          <img
            src="${featured.image_url || ""}"
            alt="${featured.title || ""}"
            class="news-card__image"
          />
          <div class="news-card__overlay"></div>
          <span class="news-badge news-badge--category">${featured.category_label}</span>
          <span class="news-badge news-badge--featured">Destaque</span>
        </div>
        <div class="news-card__body">
          <h2 class="news-card__title news-card__title--featured">
            ${featured.title || ""}
          </h2>
          <p class="news-card__subtitle">${featured.subtitle || ""}</p>
          <div class="news-meta">
            <span>${formatDate(featured.created_at)}</span>
            <span>•</span>
            <span>${featured.author || "Bidô – Samambaia Mil Graus"}</span>
          </div>
        </div>
      </article>
    `
    : `
      <p class="news-empty">Nenhuma notícia encontrada para esta categoria.</p>
    `;

  const listHtml = rest
    .map(
      (n) => `
      <article class="news-card" data-id="${n.id}">
        <div class="news-card__image-wrapper">
          <img
            src="${n.image_url || ""}"
            alt="${n.title || ""}"
            class="news-card__image"
          />
          <div class="news-card__overlay"></div>
          <span class="news-badge news-badge--category">${n.category_label}</span>
        </div>
        <div class="news-card__body">
          <h3 class="news-card__title">${n.title || ""}</h3>
          <p class="news-card__subtitle">${n.summary || ""}</p>
          <div class="news-meta">
            <span>${formatDate(n.created_at)}</span>
            <span>•</span>
            <span>${n.author || "Bidô – Samambaia Mil Graus"}</span>
          </div>
        </div>
      </article>
    `
    )
    .join("");

  const sidebarHtml = `
    <aside class="news-sidebar">
      <h3 class="news-sidebar__title">Mais lidas</h3>
      <ul class="news-sidebar__list">
        ${allNews.slice(0, 3)
          .map(
            (n) => `
          <li class="news-sidebar__item">
            <a href="news.html?id=${n.id}">
              <span class="news-sidebar__item-title">${n.title || ""}</span>
              <span class="news-sidebar__item-date">${formatDate(
                n.created_at
              )}</span>
            </a>
          </li>
        `
          )
          .join("")}
      </ul>
    </aside>
  `;

  root.innerHTML = `
    <div class="news-page">
      <section class="news-hero">
        <div class="news-hero-inner">
          <div class="news-hero-badge">
            <span class="news-hero-badge-icon">📰</span>
            <span>Últimas notícias</span>
          </div>
          <h1 class="news-hero-title">
            Notícias de
            <span>Samambaia</span>
          </h1>
          <p class="news-hero-subtitle">
            Os principais acontecimentos da cidade, com a cara do Samambaia Mil Graus.
          </p>
        </div>
      </section>

      <section class="news-filters-bar">
        <div class="news-filters-inner">
          <span class="news-filters-icon">⚙️</span>
          ${categoriesHtml}
        </div>
      </section>

      <section class="news-grid-section">
        <div class="news-grid-inner">
          <div class="news-grid">
            ${featuredHtml}
            ${listHtml}
          </div>
          ${sidebarHtml}
        </div>
      </section>
    </div>
  `;

  const tabs = root.querySelectorAll(".news-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const cat = tab.getAttribute("data-category");
      const params = new URLSearchParams(window.location.search);
      if (cat === "Todas") {
        params.delete("category");
      } else {
        params.set("category", cat);
      }
      window.location.search = params.toString();
    });
  });

  const cards = root.querySelectorAll(".news-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      if (!id) return;
      window.location.href = `news.html?id=${id}`;
    });
  });
}

// detalhe
async function renderNewsDetail(rootId, newsId) {
  const root = document.getElementById(rootId);
  if (!root) return;

  const ref = doc(db, "news", newsId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    root.innerHTML = `
      <section class="news-detail">
        <p class="news-empty">Notícia não encontrada.</p>
        <a href="news.html" class="news-back-link">Voltar para notícias</a>
      </section>
    `;
    return;
  }

  const data = snap.data();
  const rawCat = (data.category || "geral").toString();
  const label = CATEGORY_LABELS[rawCat] || rawCat;

  const news = {
    id: snap.id,
    ...data,
    category_raw: rawCat,
    category_label: label
  };

  const allNews = await fetchPublishedNews();
  const moreNews = allNews.filter((n) => n.id !== newsId).slice(0, 3);

  root.innerHTML = `
    <article class="news-detail">
      <header class="news-detail__header">
        <span class="news-badge">${news.category_label}</span>
        <h1 class="news-detail__title">${news.title || ""}</h1>
        <p class="news-detail__subtitle">${news.subtitle || ""}</p>
        <div class="news-meta">
          <span>${formatDate(news.created_at)}</span>
          <span>•</span>
          <span>${news.author || "Bidô – Samambaia Mil Graus"}</span>
        </div>
      </header>

      <div class="news-detail__image-wrapper">
        <img
          src="${news.image_url || ""}"
          alt="${news.title || ""}"
          class="news-detail__image"
        />
      </div>

      <section class="news-detail__content">
        ${news.content || ""}
      </section>

      <section class="news-more">
        <h2 class="news-more__title">Mais notícias</h2>
        <div class="news-more__list">
          ${moreNews
            .map(
              (n) => `
            <article class="news-card news-card--compact">
              <div class="news-card__image-wrapper">
                <img
                  src="${n.image_url || ""}"
                  alt="${n.title || ""}"
                  class="news-card__image"
                />
                <div class="news-card__overlay"></div>
                <span class="news-badge news-badge--category">${n.category_label}</span>
              </div>
              <div class="news-card__body">
                <h3 class="news-card__title">${n.title || ""}</h3>
                <div class="news-meta">
                  <span>${formatDate(n.created_at)}</span>
                </div>
              </div>
            </article>
          `
            )
            .join("")}
        </div>
      </section>

      <a href="news.html" class="news-back-link">Voltar para todas as notícias</a>
    </article>
  `;
}

// bootstrap
document.addEventListener("DOMContentLoaded", () => {
  renderNavbar("navbar-root");

  const rootId = "news-root";
  const newsId = getNewsIdFromQuery();

  if (newsId) {
    renderNewsDetail(rootId, newsId);
  } else {
    renderNewsList(rootId);
  }

  renderFooter("footer-root");
});
