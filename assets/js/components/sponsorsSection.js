// assets/js/components/sponsorsSection.js
import { loadSponsors } from "../state/sponsorsState.js";

function escapeHtml(str) {
  return (str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildItemHtml(s) {
  const name = escapeHtml(s.name || "");
  const logo = s.logo_url ? escapeHtml(s.logo_url) : "";
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return `
    <div class="brand-pill" role="listitem" aria-label="${name}">
      <div class="brand-logo">
        ${
          logo
            ? `<img src="${logo}" alt="${name}" loading="lazy" decoding="async" />`
            : `<span class="brand-initial">${initial}</span>`
        }
      </div>
      <div class="brand-name">${name}</div>
    </div>
  `;
}

function duplicateToFill(trackEl, minCopies = 2) {
  const baseHtml = trackEl.innerHTML;
  let copies = 1;

  // Primeiro garante pelo menos 2x (necessário pra loop de -50%)
  while (copies < minCopies) {
    trackEl.insertAdjacentHTML("beforeend", baseHtml);
    copies += 1;
  }

  // Depois aumenta até ficar bem “cheio” (evita gap em telas ultra wide)
  // limite de segurança
  let guard = 0;
  while (trackEl.scrollWidth < window.innerWidth * 2 && guard < 8) {
    trackEl.insertAdjacentHTML("beforeend", baseHtml);
    guard += 1;
  }
}

export function renderSponsorsSection(rootId = "home-root") {
  const root = document.getElementById(rootId);
  if (!root) return;

  const sponsors = loadSponsors().filter((s) => s.active !== false);
  if (!sponsors.length) return;

  const itemsHtml = sponsors.map(buildItemHtml).join("");

  root.insertAdjacentHTML(
    "beforeend",
    `
    <section class="brands-strip reveal-section" aria-label="Marcas que já trabalhei">
      <div class="brands-strip-inner">
        <div class="brands-strip-header">
          <div class="brands-strip-title">Marcas que já trabalhei</div>
          <div class="brands-strip-sub">Parcerias, publis e presença local</div>
        </div>

        <div class="brands-strip-viewport">
          <div class="brands-strip-track" role="list">
            ${itemsHtml}
          </div>
        </div>
      </div>
    </section>
    `
  );

  const track = root.querySelector(".brands-strip-track");
  if (!track) return;

  duplicateToFill(track, 2);

  // Recalcula no resize (debounce simples)
  let t = null;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      // reseta pro “base” (primeiro bloco) e duplica de novo
      const baseCount = sponsors.length;
      const nodes = Array.from(track.children);
      nodes.forEach((n, idx) => {
        if (idx >= baseCount) n.remove();
      });
      duplicateToFill(track, 2);
    }, 160);
  });
}
