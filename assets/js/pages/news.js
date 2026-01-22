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
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const CATEGORIES = [
  "Todas",
  "Política",
  "Economia",
  "Segurança",
  "Cultura",
  "Esportes",
  "Entretenimento",
  "Geral",
];

// mapa categoria salvo → label exibida
const CATEGORY_LABELS = {
  politica: "Política",
  economia: "Economia",
  seguranca: "Segurança",
  cultura: "Cultura",
  esportes: "Esportes",
  entretenimento: "Entretenimento",
  geral: "Geral",
};

// ----------------------------
// STATE – filtros e paginação
// ----------------------------

let ALL_NEWS_CACHE = [];
let FILTERED_NEWS_CACHE = [];

const NEWS_PAGE_SIZE = 8;

const newsFiltersState = {
  search: "",
  sort: "newest", // 'newest' | 'oldest'
  page: 1,
  category: "Todas",
};


function applyNewsFilters() {
  const search = newsFiltersState.search.toLowerCase();
  const sort = newsFiltersState.sort;
  const category = newsFiltersState.category;

  let list =
    category === "Todas"
      ? [...ALL_NEWS_CACHE]
      : ALL_NEWS_CACHE.filter((n) => n.category_label === category);

  if (search) {
    list = list.filter((n) => {
      const target = `${n.title || ""} ${n.subtitle || ""} ${n.summary || ""
        } ${n.content || ""}`.toLowerCase();
      return target.includes(search);
    });
  }

  list.sort((a, b) => {
    const da = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
    const db = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
    return sort === "oldest" ? da - db : db - da;
  });

  FILTERED_NEWS_CACHE = list;
}

function paginateNews() {
  const start = (newsFiltersState.page - 1) * NEWS_PAGE_SIZE;
  const end = start + NEWS_PAGE_SIZE;
  return FILTERED_NEWS_CACHE.slice(start, end);
}


// ----------------------------
// ADS – helpers
// ----------------------------

async function fetchAdsByPosition(position) {
  const col = collection(db, "ads");
  const q = query(
    col,
    where("active", "==", true),
    where("position", "==", position),
    orderBy("created_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function renderAdCard(ad, options = {}) {
  if (!ad || !ad.image_url) return "";

  const variant = options.variant || "full";
  const hasDescription = ad.description && ad.description.trim().length > 0;
  const hasLink = ad.link && ad.link.trim().length > 0;
  const onclick = hasLink ? `onclick="window.open('${ad.link}', '_blank')"` : "";

  const extraClass =
    variant === "middle" ? "news-ad-card--middle" : "news-ad-card--full";

  return `
    <article class="news-ad-card ${extraClass}" ${onclick}>
      <div
        class="news-ad-card-bg"
        style="background-image: url('${ad.image_url}');"
      ></div>
      <div class="news-ad-card-overlay"></div>
      <div class="news-ad-card-content">
        <span class="news-ad-badge">PUBLICIDADE</span>
        <h2 class="news-ad-title">${ad.title || ""}</h2>
        ${hasDescription
      ? `<p class="news-ad-description">${ad.description}</p>`
      : ""
    }
        ${hasLink
      ? `<button class="news-ad-button" type="button">
                 <span>Saiba mais →</span>
               </button>`
      : ""
    }
      </div>
    </article>
  `;
}

// carrossel de ads (topo / final)
function renderAdsCarousel(ads, options = {}) {
  if (!ads || ads.length === 0) return "";

  const variant = options.variant || "full";

  // se só tiver um, não precisa de carrossel
  if (ads.length === 1) {
    return renderAdCard(ads[0], { variant });
  }

  const slidesHtml = ads
    .map((ad, index) => {
      const activeClass = index === 0 ? "news-ad-slide--active" : "";
      return `
        <div class="news-ad-slide ${activeClass}" data-ad-index="${index}">
          ${renderAdCard(ad, { variant })}
        </div>
      `;
    })
    .join("");

  return `
    <div class="news-ad-carousel" data-ad-count="${ads.length}">
      <button
        class="news-ad-nav news-ad-nav--prev"
        type="button"
        aria-label="Anterior"
      >
        ‹
      </button>
      <div class="news-ad-carousel-inner">
        ${slidesHtml}
      </div>
      <button
        class="news-ad-nav news-ad-nav--next"
        type="button"
        aria-label="Próximo"
      >
        ›
      </button>
    </div>
  `;
}

// ----------------------------
// NEWS
// ----------------------------

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
      category_label: label,
    };
  });
}

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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

/**
 * Converte texto cru do textarea em HTML:
 * - Linhas em branco (duas quebras ou mais) viram parágrafos distintos
 * - Quebras simples viram <br>
 */
function formatContentToHtml(raw) {
  if (!raw) return "";
  const trimmed = raw.trim();

  const paragraphs = trimmed.split(/\n\s*\n/);

  return paragraphs
    .map((p) => {
      const safe = p
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const withBr = safe.replace(/\n/g, "<br />");
      return `<p>${withBr}</p>`;
    })
    .join("");
}

// lista
async function renderNewsList(rootId) {
  const root = document.getElementById(rootId);
  if (!root) return;

  const selectedCategory = getSelectedCategory();
  newsFiltersState.category = selectedCategory;
  newsFiltersState.page = 1;


  const [allNews, topAds, middleAds, bottomAds] = await Promise.all([
    fetchPublishedNews(),
    fetchAdsByPosition("top"),
    fetchAdsByPosition("middle"),
    fetchAdsByPosition("bottom"),
  ]);

  ALL_NEWS_CACHE = allNews;
  applyNewsFilters();
  const filtered = FILTERED_NEWS_CACHE;
  const paginated = paginateNews();
  const totalPages = Math.max(1, Math.ceil(filtered.length / NEWS_PAGE_SIZE));


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

  // === escolhe a notícia em destaque (card maior) ===

  // 1) tenta achar uma notícia marcada como Principal no admin
  let featured = paginated.find((n) => n.featured);
  if (!featured && paginated.length > 0) {
    featured = paginated[0];
  }
  const rest = featured ? paginated.filter((n) => n.id !== featured.id) : [];


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

  const middleAd = middleAds[0] || null;

  let listHtml = "";
  rest.forEach((n, index) => {
    listHtml += `
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
    `;



    // depois do segundo card comum, insere o anúncio de meio (card simples)
    if (index === 1 && middleAd) {
      listHtml += renderAdCard(middleAd, { variant: "middle" });
    }
  });

  const sidebarHtml = `
    <aside class="news-sidebar">
      <h3 class="news-sidebar__title">Mais lidas</h3>
      <ul class="news-sidebar__list">
        ${allNews
      .slice(0, 3)
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

  const topAdHtml =
    topAds && topAds.length > 0
      ? renderAdsCarousel(topAds, { variant: "full" })
      : "";

  const bottomAdHtml =
    bottomAds && bottomAds.length > 0
      ? renderAdsCarousel(bottomAds, { variant: "full" })
      : "";

  root.innerHTML = `
    <div class="news-page">
      <section class="news-hero">
        <div class="news-hero-inner">
          <div class="news-hero-badge">
            <span class="news-hero-badge-icon">📰</span>
            <span>Últimas notícias</span>
          </div>
          <h1 class="news-hero__title">
            <span class="news-hero__title-line news-hero__title-portal">PORTAL</span>
            <span class="news-hero__title-line news-hero__title-mil-graus">MIL GRAUS</span>
          </h1>
          <p class="news-hero-subtitle">
            Os principais acontecimentos da cidade, com a cara do Samambaia Mil Graus.
          </p>
        </div>
      </section>
<section class="news-filters-bar">
        <div class="news-filters-inner">
          <div class="news-filters-top">
            <div class="news-search-wrapper">
              <span class="news-search-icon">
                <i class="bi bi-search"></i>
              </span>
              <input
                type="search"
                id="news-search-input"
                class="news-search-input"
                placeholder="Buscar notícias..."
              />
            </div>

            <div class="news-filters-top-right">
              <button class="news-filters-toggle" type="button">
                <span class="news-filters-toggle-icon">☰</span>
                <span class="news-filters-toggle-label">Filtros</span>
              </button>

              <select id="news-sort-select" class="news-sort-select">
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigas</option>
              </select>
            </div>
          </div>

          <div class="news-tabs-wrapper">
            ${categoriesHtml}
          </div>
        </div>
      </section>



      <section class="news-grid-section">
        <div class="news-grid-inner">
          <div class="news-grid">
            ${topAdHtml}
            ${featuredHtml}
            ${listHtml}
            ${bottomAdHtml}
          </div>
          ${sidebarHtml}
        </div>
      </section>
            <section class="news-pagination-section">
        <div id="news-pagination" class="news-pagination"></div>
      </section>

    </div>
  `;

  // tabs
    const tabs = root.querySelectorAll(".news-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const cat = tab.getAttribute("data-category");
      if (!cat || cat === newsFiltersState.category) return;

      newsFiltersState.category = cat;
      newsFiltersState.page = 1;

      // atualiza visualmente a aba ativa
      tabs.forEach((t) =>
        t.classList.toggle(
          "news-tab--active",
          t.getAttribute("data-category") === cat
        )
      );

      // mostra skeleton enquanto refaz a lista
      renderNewsSkeleton();

      applyNewsFilters();
      const paginated = paginateNews();
      reRenderNewsGrid(paginated);
      const totalPagesLocal = Math.max(
        1,
        Math.ceil(FILTERED_NEWS_CACHE.length / NEWS_PAGE_SIZE)
      );
      renderNewsPagination(totalPagesLocal);
    });
  });

  // cards
  const cards = root.querySelectorAll(".news-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      if (!id) return;
      window.location.href = `news.html?id=${id}`;
    });
  });

  // inicializa carrosséis de ads (topo e final)
  const carousels = root.querySelectorAll(".news-ad-carousel");
  carousels.forEach((carousel) => {
    const slides = carousel.querySelectorAll(".news-ad-slide");
    if (!slides.length) return;

    let index = 0;
    const total = slides.length;
    let timer = null;

    const showSlide = (i) => {
      slides.forEach((slide, idx) => {
        slide.classList.toggle("news-ad-slide--active", idx === i);
      });
      index = i;
    };

    const next = () => showSlide((index + 1) % total);
    const prev = () => showSlide((index - 1 + total) % total);

    const btnNext = carousel.querySelector(".news-ad-nav--next");
    const btnPrev = carousel.querySelector(".news-ad-nav--prev");

    if (btnNext) {
      btnNext.addEventListener("click", (e) => {
        e.stopPropagation();
        next();
        restartTimer();
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener("click", (e) => {
        e.stopPropagation();
        prev();
        restartTimer();
      });
    }

    const startTimer = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(next, 7000); // 7s
    };

    const restartTimer = () => {
      if (total <= 1) return;
      startTimer();
    };

    carousel.addEventListener("mouseenter", () => {
      if (timer) clearInterval(timer);
    });
    carousel.addEventListener("mouseleave", () => {
      if (total > 1) startTimer();
    });

    if (total > 1) startTimer();
  });

   // inicializa filtros (busca + ordenação)
  setupNewsFiltersUI(root, totalPages);
}


function renderNewsSkeleton() {
  const grid = document.querySelector(".news-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div class="news-skeleton">
      <div class="news-skeleton__card"></div>
      <div class="news-skeleton__card"></div>
      <div class="news-skeleton__card"></div>
    </div>
  `;
}


function renderNewsPagination(totalPages) {
  const container = document.getElementById("news-pagination");
  if (!container) return;

  if (!FILTERED_NEWS_CACHE.length || totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  const current = newsFiltersState.page;
  let html = "";

  if (current > 1) {
    html += `<button class="news-page-btn news-page-btn--nav" data-page="${current - 1
      }">«</button>`;
  }

  for (let p = 1; p <= totalPages; p++) {
    const activeClass = p === current ? "news-page-btn--active" : "";
    html += `<button class="news-page-btn ${activeClass}" data-page="${p}">${p}</button>`;
  }

  if (current < totalPages) {
    html += `<button class="news-page-btn news-page-btn--nav" data-page="${current + 1
      }">»</button>`;
  }

  container.innerHTML = html;

  container.querySelectorAll(".news-page-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = Number(btn.getAttribute("data-page"));
      if (!page || page === newsFiltersState.page) return;
      newsFiltersState.page = page;
      applyNewsFilters();
      const paginated = paginateNews();
      reRenderNewsGrid(paginated);
      const totalPagesLocal = Math.max(
        1,
        Math.ceil(FILTERED_NEWS_CACHE.length / NEWS_PAGE_SIZE)
      );
      renderNewsPagination(totalPagesLocal);
    });
  });
}

function reRenderNewsGrid(paginated) {
  const grid = document.querySelector(".news-grid");
  if (!grid) return;

  // mantém os anúncios e sidebar como estão
  const topAdHtml = grid.querySelector(".news-ad-carousel")
    ? grid
      .querySelectorAll(".news-ad-carousel")[0]
      .outerHTML
    : "";
  const bottomAdHtml =
    grid.querySelectorAll(".news-ad-carousel").length > 1
      ? grid
        .querySelectorAll(".news-ad-carousel")[1]
        .outerHTML
      : "";

  // destaque + lista
  let featured = paginated.find((n) => n.featured);
  if (!featured && paginated.length > 0) {
    featured = paginated[0];
  }
  const rest = featured ? paginated.filter((n) => n.id !== featured.id) : [];

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
      <p class="news-empty">Nenhuma notícia encontrada para esta combinação de filtros.</p>
    `;

  let listHtml = "";
  rest.forEach((n) => {
    listHtml += `
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
    `;
  });



  grid.innerHTML = `
    ${topAdHtml}
    ${featuredHtml}
    ${listHtml}
    ${bottomAdHtml}
  `;

  // rebind de clique nos cards
  const cards = grid.querySelectorAll(".news-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      if (!id) return;
      window.location.href = `news.html?id=${id}`;
    });
  });
}

function setupNewsFiltersUI(root, totalPages) {
  const searchInput = root.querySelector("#news-search-input");
  const sortSelect = root.querySelector("#news-sort-select");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      newsFiltersState.search = e.target.value;
      newsFiltersState.page = 1;
      applyNewsFilters();
      const paginated = paginateNews();
      reRenderNewsGrid(paginated);
      const totalPagesLocal = Math.max(
        1,
        Math.ceil(FILTERED_NEWS_CACHE.length / NEWS_PAGE_SIZE)
      );
      renderNewsPagination(totalPagesLocal);
    });
  }

  if (sortSelect) {
    sortSelect.value = newsFiltersState.sort;
    sortSelect.addEventListener("change", (e) => {
      newsFiltersState.sort = e.target.value;
      newsFiltersState.page = 1;
      applyNewsFilters();
      const paginated = paginateNews();
      reRenderNewsGrid(paginated);
      const totalPagesLocal = Math.max(
        1,
        Math.ceil(FILTERED_NEWS_CACHE.length / NEWS_PAGE_SIZE)
      );
      renderNewsPagination(totalPagesLocal);
    });
  }

  renderNewsPagination(totalPages);
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
    category_label: label,
  };

  const allNews = await fetchPublishedNews();
  const moreNews = allNews.filter((n) => n.id !== newsId).slice(0, 3);

  const hasSource =
    (news.source_name && news.source_name.trim()) ||
    (news.source_instagram && news.source_instagram.trim()) ||
    (news.source_url && news.source_url.trim());

  const sourceHtml = hasSource
    ? `
      <div class="news-source">
        <span class="news-source-label">Fonte</span>
        ${news.source_name
      ? `<span class="news-source-text">${news.source_name}</span>`
      : ""
    }
        ${news.source_instagram
      ? `<a
                  href="https://instagram.com/${news.source_instagram.replace(
        /^@/,
        ""
      )}"
                  class="news-source-link"
                  target="_blank"
                  rel="noopener noreferrer"
               >
                  @${news.source_instagram.replace(/^@/, "")}
               </a>`
      : ""
    }
        ${news.source_url
      ? `<a
                  href="${news.source_url}"
                  class="news-source-link"
                  target="_blank"
                  rel="noopener noreferrer"
               >
                  Ver publicação
               </a>`
      : ""
    }
      </div>
    `
    : "";

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
        ${sourceHtml}
      </header>

      <div class="news-detail__image-wrapper">
        <img
          src="${news.image_url || ""}"
          alt="${news.title || ""}"
          class="news-detail__image"
        />
      </div>

      <section class="news-detail__content-card">
        <div class="news-detail__content">
          ${formatContentToHtml(news.content || "")}
        </div>
      </section>

      <section class="news-more">
        <h2 class="news-more__title">Mais notícias</h2>
        <div class="news-more__list">
          ${moreNews
      .map(
        (n) => `
            <article class="news-card news-card--compact" data-id="${n.id}">
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

  // clique nos mini cards de "Mais notícias"
  const moreCards = root.querySelectorAll(
    ".news-more__list .news-card--compact"
  );
  moreCards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      if (!id) return;
      window.location.href = `news.html?id=${id}`;
    });
  });
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
