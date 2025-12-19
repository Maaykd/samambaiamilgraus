// assets/js/components/homeSponsors.js
import { db } from "../firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

export async function renderHomeSponsors(container) {
  container.innerHTML = `
    <div class="admin-card" style="text-align:center;">
      <p style="color:#9ca3af;">Carregando patrocinadores...</p>
    </div>
  `;

  try {
    const snap = await getDocs(collection(db, "sponsors"));
    const sponsors = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(s => s.active !== false); // só ativos

    if (!sponsors.length) {
      container.innerHTML = `
        <div class="admin-card" style="text-align:center;">
          <p style="color:#6b7280;">Nenhum patrocinador cadastrado</p>
        </div>
      `;
      return;
    }

    const itemsHtml = sponsors
      .map(
        (s) => `
      <div class="home-sponsor-card">
        <div class="home-sponsor-logo">
          ${s.logo_url
            ? `<img src="${s.logo_url}" alt="${s.name}" />`
            : `<span>${s.name ? s.name.charAt(0).toUpperCase() : "?"}</span>`}
        </div>
        <div class="home-sponsor-info">
          <h3>${s.name}</h3>
          ${s.instagram ? `<p>@${s.instagram.replace("@", "")}</p>` : ""}
        </div>
      </div>
    `
      )
      .join("");

    container.innerHTML = `
      <section class="sponsors-section">
        <h2 class="sponsors-title">Patrocinadores</h2>
        <div class="sponsors-grid">
          ${itemsHtml}
        </div>
      </section>
    `;
  } catch (err) {
    console.error("Erro ao carregar patrocinadores para Home:", err);
    container.innerHTML = `
      <div class="admin-card" style="text-align:center;">
        <p style="color:#ef4444;">Erro ao carregar patrocinadores.</p>
      </div>
    `;
  }
}
