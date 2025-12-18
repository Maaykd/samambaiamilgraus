// assets/js/components/sponsorsCarousel.js

const DEFAULT_SPONSORS = [
  { name: "Dia a Dia", instagram: "@atacadaodiadia" },
  { name: "Burger King", instagram: "@burguerking" },
  { name: "Milky Moo", instagram: "@milkymoo" },
  { name: "Estácio", instagram: "@estacio" },
  { name: "CCI Senior", instagram: "@cciccisenior" },
  { name: "Enxovais Paulista", instagram: "@enxovaispaulista" },
  { name: "SamamBar", instagram: "@samambar.df" },
  { name: "Dom Müster", instagram: "@dommusterbsb" },
];

export function renderSponsorsCarousel(rootId = "home-root", sponsors = []) {
  const root = document.getElementById(rootId);
  if (!root) return;

  // se tiver patrocinadores ativos do admin, usa eles; senão, usa os defaults
  const displaySponsors = sponsors.length > 0 ? sponsors : DEFAULT_SPONSORS;

  const pillHtml = displaySponsors
    .map((s) => {
      const initial = s.name ? s.name.charAt(0).toUpperCase() : "?";

      const avatarHtml = s.logo_url
        ? `<img src="${s.logo_url}" alt="${s.name}" />`
        : initial;

      return `
        <button class="sponsor-pill">
          <div class="sponsor-avatar">
            ${avatarHtml}
          </div>
          <div class="sponsor-text">
            <div class="sponsor-text-name">${s.name}</div>
            <div class="sponsor-text-handle">${s.instagram || ""}</div>
          </div>
        </button>
      `;
    })
    .join("");

  // duplicar para criar loop visual
  const trackHtml = pillHtml + pillHtml + pillHtml;

  root.insertAdjacentHTML(
    "beforeend",
    `
    <section class="sponsors reveal-section">
      <div class="sponsors-inner">
        <p class="sponsors-title">MARCAS QUE JÁ TRABALHEI</p>
        <div class="sponsors-track-wrapper">
          <div class="sponsors-track">
            ${trackHtml}
          </div>
        </div>
      </div>
    </section>
  `
  );
}
