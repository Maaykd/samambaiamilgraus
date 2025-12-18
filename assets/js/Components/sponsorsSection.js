// assets/js/components/sponsorsSection.js
import { loadSponsors } from "../state/sponsorsState.js";

export function renderSponsorsSection(rootId = "home-root") {
  const root = document.getElementById(rootId);
  if (!root) return;

  const sponsors = loadSponsors().filter(s => s.active !== false);

  if (!sponsors.length) return;

  const sponsorsHtml = sponsors.map(s => `
    <button class="sponsor-pill">
      <div class="sponsor-avatar">
        ${s.logo_url
          ? `<img src="${s.logo_url}" alt="${s.name}" />`
          : (s.name ? s.name.charAt(0).toUpperCase() : "?")
        }
      </div>
      <div class="sponsor-text">
        <div class="sponsor-text-name">${s.name}</div>
        <div class="sponsor-text-handle">${s.instagram || ""}</div>
      </div>
    </button>
  `).join("");

  const sectionHtml = `
    <section class="sponsors reveal-section">
      <div class="sponsors-inner">
        <div class="sponsors-title">MARCAS QUE JÁ TRABALHEI</div>
        <div class="sponsors-track-wrapper">
          <div class="sponsors-track">
            ${sponsorsHtml}
          </div>
        </div>
      </div>
    </section>
  `;

  root.insertAdjacentHTML("beforeend", sectionHtml);
}
