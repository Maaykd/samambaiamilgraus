// assets/js/components/heroSection.js

const HERO_STATS = [
  {
    icon: "👥",
    value: "118K",
    label: "Seguidores",
  },
  {
    icon: "👁️",
    value: "5.4M",
    label: "Visualizações",
  },
  {
    icon: "📄",
    value: "3.5K",
    label: "Posts",
  },
];

export function renderHeroSection(rootId = "home-root", content = {}) {
  const root = document.getElementById(rootId);
  if (!root) return;

  const whatsappNumber = (content.whatsapp || "5561981988735").replace(/\D/g, "");
  const whatsappLink = `https://wa.me/${whatsappNumber}`;

  const title = content.title || "Prazer, eu sou o Bidô!";
  const description =
    content.description ||
    "Vulgo Mil Graus!! Cria de Samambaia, 33 anos, cursando publicidade e propaganda. A página foi fundada em 2021 com o intuito de trazer notícias e entretenimento com muito humor.";

  // imagem vinda do Admin (hero_image_url) com fallback
  const heroImageUrl =
    content.image_url ||
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop";

  const statsHtml = HERO_STATS.map(
    (s) => `
    <div class="hero-stat-card">
      <div class="hero-stat-icon">${s.icon}</div>
      <div class="hero-stat-value">${s.value}</div>
      <div class="hero-stat-label">${s.label}</div>
    </div>
  `
  ).join("");

  const instagramSvg = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
      <path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  `;

  const heroHtml = `
  <section class="hero reveal-section">
    <div class="hero-bg-1"></div>
    <div class="hero-bg-2"></div>
    
    <div class="hero-inner">
      <!-- Left side -->
      <div class="hero-left">
        <!-- Badge com Instagram -->
        <div class="hero-badge">
          ${instagramSvg}
          <span>@samambaiamilgraus</span>
        </div>

        <!-- Títulos -->
        <h1 class="hero-title-main">SAMAMBAIA</h1>
        <h2 class="hero-title-sub">MIL GRAUS</h2>

        <!-- Subtítulo -->
        <p class="hero-subtitle">${title}</p>

        <!-- Descrição -->
        <p class="hero-text">${description}</p>

        <!-- Stats com ícones -->
        <div class="hero-stats">
          ${statsHtml}
        </div>

        <!-- Botões -->
        <div class="hero-actions">
          <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" class="btn-cta">
            💬 Falar no WhatsApp
          </a>
          <a href="https://instagram.com/samambaiamilgraus" target="_blank" rel="noopener noreferrer" class="btn-outline">
            ${instagramSvg}
            @samambaiamilgraus
          </a>
        </div>
      </div>

      <!-- Right side - Image -->
      <div class="hero-right">
        <div class="hero-right-inner">
          <div class="hero-ring-1"></div>
          <div class="hero-ring-2"></div>
          
          <div class="hero-photo-wrapper">
            <img 
              src="${heroImageUrl}" 
              alt="Samambaia Mil Graus"
              class="hero-photo"
            />
            <div class="hero-badge-bottom">CUIDAAA!! 🔥</div>
          </div>
        </div>
      </div>
    </div>
  </section>
`;

  root.insertAdjacentHTML("beforeend", heroHtml);
}
