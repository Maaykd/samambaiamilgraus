// assets/js/components/contentSection.js

const FEATURES = [
  {
    icon: "😊",
    title: "Humor e Entretenimento",
    description: "Conteúdo leve e divertido pra animar seu dia"
  },
  {
    icon: "📰",
    title: "Notícias da Cidade",
    description: "Cobertura completa dos acontecimentos de Samambaia"
  },
  {
    icon: "📣",
    title: "Publicidade Diferente",
    description: "Divulgação criativa e autêntica para marcas"
  },
  {
    icon: "⚠️",
    title: "Denúncias",
    description: "Voz da comunidade e moradores da região"
  }
];

export function renderContentSection(rootId = "home-root") {
  const root = document.getElementById(rootId);
  if (!root) return;

  const featuresHtml = FEATURES.map(
    f => `
      <div class="content-card">
        <div class="content-card-icon">${f.icon}</div>
        <h3 class="content-card-title">${f.title}</h3>
        <p class="content-card-text">${f.description}</p>
      </div>
    `
  ).join("");

  const statsHtml = [
    { value: "85%", label: "Reels" },
    { value: "12%", label: "Stories" },
    { value: "60%", label: "Homens" },
    { value: "40%", label: "Mulheres" }
  ]
    .map(
      s => `
      <div class="content-stat-card">
        <div class="content-stat-value">${s.value}</div>
        <div class="content-stat-label">${s.label}</div>
      </div>
    `
    )
    .join("");

  root.insertAdjacentHTML(
    "beforeend",
    `
    <section class="content-section reveal-section">
      <div class="content-bg-1"></div>
      <div class="content-bg-2"></div>

      <div class="content-inner">
        <div class="content-header">
          <div class="content-badge">
            <span>✨</span>
            <span>Conteúdo autoral</span>
          </div>
          <h2 class="content-title">
            O que você encontra na
            <span>Samambaia Mil Graus</span>
          </h2>
        </div>

        <div class="content-grid">
          ${featuresHtml}
        </div>

        <div class="content-stats-grid">
          ${statsHtml}
        </div>
      </div>
    </section>
  `
  );
}
