// assets/js/pages/news.js
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

// mock inicial de notícias
const MOCK_NEWS = [
  {
    id: "1",
    title: "Operação da PM agita a noite em Samambaia",
    subtitle: "Viaturas, helicóptero e muita movimentação na QR 402",
    summary:
      "Moradores relataram intenso movimento policial na região, com bloqueios de rua e abordagem a veículos.",
    content: `
      <p>Moradores de Samambaia relataram uma grande operação policial na noite desta quinta-feira na região da QR 402.</p>
      <p>Segundo relatos enviados ao Samambaia Mil Graus, diversas viaturas da PMDF e um helicóptero participaram da ação.</p>
      <p>Até o momento, não há confirmação oficial sobre prisões ou apreensões, mas a população registrou vídeos e fotos
      que viralizaram nas redes sociais.</p>
    `,
    image_url:
      "https://via.placeholder.com/1200x600?text=Operacao+PM+Samambaia",
    created_at: "2026-01-05T20:30:00Z",
    category: "Segurança",
    author: "Redação SMG"
  },
  {
    id: "2",
    title: "Evento beneficente arrecada alimentos em Samambaia",
    subtitle: "Ação social reúne moradores e comerciantes da região",
    summary:
      "Campanha organizada por influenciadores locais reuniu mais de 2 toneladas de alimentos para famílias carentes.",
    content: `
      <p>A campanha beneficente realizada neste fim de semana em Samambaia reuniu centenas de moradores em uma ação de solidariedade.</p>
      <p>Com o apoio de comerciantes locais e do Samambaia Mil Graus, foram arrecadadas mais de 2 toneladas de alimentos,
      que serão distribuídos para famílias em situação de vulnerabilidade na cidade.</p>
    `,
    image_url:
      "https://via.placeholder.com/1200x600?text=Evento+Beneficente+Samambaia",
    created_at: "2026-01-03T16:00:00Z",
    category: "Eventos",
    author: "Redação SMG"
  },
  {
    id: "3",
    title: "Novo point gastronômico abre as portas na cidade",
    subtitle: "Hambúrgueres artesanais e música ao vivo animam a galera",
    summary:
      "Inauguração movimenta a noite de Samambaia e promete virar ponto fixo dos encontros de fim de semana.",
    content: `
      <p>Samambaia ganhou mais uma opção de lazer e gastronomia com a inauguração de um novo espaço focado em hambúrgueres artesanais.</p>
      <p>A casa abriu as portas com promoção especial, música ao vivo e presença de influenciadores locais.</p>
    `,
    image_url:
      "https://via.placeholder.com/1200x600?text=Novo+Point+Gastronomico",
    created_at: "2026-01-01T19:00:00Z",
    category: "Entretenimento",
    author: "Redação SMG"
  }
];

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

function formatDate(dateStr) {
  const d = new Date(dateStr);
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
function renderNewsList(rootId) {
  const root = document.getElementById(rootId);
  if (!root) return;

  const selectedCategory = getSelectedCategory();

  const filtered =
    selectedCategory === "Todas"
      ? MOCK_NEWS
      : MOCK_NEWS.filter((n) => n.category === selectedCategory);

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
            src="${featured.image_url}"
            alt="${featured.title}"
            class="news-card__image"
          />
          <div class="news-card__overlay"></div>
          <span class="news-badge news-badge--category">${featured.category}</span>
          <span class="news-badge news-badge--featured">Destaque</span>
        </div>
        <div class="news-card__body">
          <h2 class="news-card__title news-card__title--featured">
            ${featured.title}
          </h2>
          <p class="news-card__subtitle">${featured.subtitle}</p>
          <div class="news-meta">
            <span>${formatDate(featured.created_at)}</span>
            <span>•</span>
            <span>${featured.author}</span>
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
            src="${n.image_url}"
            alt="${n.title}"
            class="news-card__image"
          />
          <div class="news-card__overlay"></div>
          <span class="news-badge news-badge--category">${n.category}</span>
        </div>
        <div class="news-card__body">
          <h3 class="news-card__title">${n.title}</h3>
          <p class="news-card__subtitle">${n.summary}</p>
          <div class="news-meta">
            <span>${formatDate(n.created_at)}</span>
            <span>•</span>
            <span>${n.author}</span>
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
        ${MOCK_NEWS.slice(0, 3)
          .map(
            (n) => `
          <li class="news-sidebar__item">
            <a href="news.html?id=${n.id}">
              <span class="news-sidebar__item-title">${n.title}</span>
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
function renderNewsDetail(rootId, newsId) {
  const root = document.getElementById(rootId);
  if (!root) return;

  const news = MOCK_NEWS.find((n) => n.id === newsId);

  if (!news) {
    root.innerHTML = `
      <section class="news-detail">
        <p class="news-empty">Notícia não encontrada.</p>
        <a href="news.html" class="news-back-link">Voltar para notícias</a>
      </section>
    `;
    return;
  }

  const moreNews = MOCK_NEWS.filter((n) => n.id !== newsId).slice(0, 3);

  root.innerHTML = `
    <article class="news-detail">
      <header class="news-detail__header">
        <span class="news-badge">${news.category}</span>
        <h1 class="news-detail__title">${news.title}</h1>
        <p class="news-detail__subtitle">${news.subtitle}</p>
        <div class="news-meta">
          <span>${formatDate(news.created_at)}</span>
          <span>•</span>
          <span>${news.author}</span>
        </div>
      </header>

      <div class="news-detail__image-wrapper">
        <img
          src="${news.image_url}"
          alt="${news.title}"
          class="news-detail__image"
        />
      </div>

      <section class="news-detail__content">
        ${news.content}
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
                  src="${n.image_url}"
                  alt="${n.title}"
                  class="news-card__image"
                />
                <div class="news-card__overlay"></div>
                <span class="news-badge news-badge--category">${n.category}</span>
              </div>
              <div class="news-card__body">
                <h3 class="news-card__title">${n.title}</h3>
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
