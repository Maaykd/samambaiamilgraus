import { loadSponsors, saveSponsors } from "../state/sponsorsState.js";
export function renderAdminSponsorsManager(container) {
  let sponsors = loadSponsors();

  container.innerHTML = `
    <section class="admin-sponsors">
      <div class="admin-card" id="admin-sponsors-form"></div>
      <div id="admin-sponsors-list"></div>
    </section>
  `;

  const formBox = container.querySelector("#admin-sponsors-form");
  const listBox = container.querySelector("#admin-sponsors-list");

  renderForm(formBox);
  renderList(listBox, sponsors);

  function renderForm(box) {
    box.innerHTML = `
      <h2 class="admin-content-title">Adicionar Patrocinador</h2>
      <div class="admin-field-group">
        <label class="admin-label">Nome *</label>
        <input id="sponsor-name" class="admin-input-full" placeholder="Nome da marca" />
      </div>
      <div class="admin-field-group">
        <label class="admin-label">Instagram (@)</label>
        <input id="sponsor-instagram" class="admin-input-full" placeholder="@marca" />
      </div>
      <div class="admin-field-group">
        <label class="admin-label">URL do Logo</label>
        <input id="sponsor-logo" class="admin-input-full" placeholder="https://..." />
      </div>
      <button id="sponsor-create-btn" class="admin-btn-primary-full">
        ➕ Adicionar Patrocinador
      </button>
      <p id="sponsor-form-status" class="admin-status"></p>
    `;

    const nameEl = box.querySelector("#sponsor-name");
    const instaEl = box.querySelector("#sponsor-instagram");
    const logoEl = box.querySelector("#sponsor-logo");
    const statusEl = box.querySelector("#sponsor-form-status");

    box.querySelector("#sponsor-create-btn").addEventListener("click", () => {
      const name = nameEl.value.trim();
      if (!name) {
        statusEl.textContent = "Preencha pelo menos o nome.";
        return;
      }

      const sponsor = {
        id: Date.now(),
        name,
        instagram: instaEl.value.trim(),
        logo_url: logoEl.value.trim(),
        active: true,
      };

      sponsors.push(sponsor);
      saveSponsors(sponsors);

      nameEl.value = "";
      instaEl.value = "";
      logoEl.value = "";

      statusEl.textContent = "Patrocinador adicionado!";
      setTimeout(() => (statusEl.textContent = ""), 1500);
      renderList(listBox, sponsors);
    });
  }

  function renderList(box, list) {
    if (!list || list.length === 0) {
      box.innerHTML = `
        <div class="admin-card" style="margin-top:1.5rem; text-align:center;">
          <p style="color:#6b7280;">Nenhum patrocinador cadastrado</p>
        </div>
      `;
      return;
    }

    const itemsHtml = list
      .map(
        (s) => `
    <div class="admin-card admin-sponsor-item">
      <div class="admin-sponsor-main">
        <div class="admin-sponsor-avatar">
          ${s.name ? s.name.charAt(0).toUpperCase() : "?"}
        </div>
        <div class="admin-sponsor-info">
          <h3>${s.name}</h3>
          <p class="admin-sponsor-handle">${s.instagram || ""}</p>
        </div>
      </div>

      <div class="admin-sponsor-footer">
        <div class="admin-sponsor-toggle">
          <button
            class="admin-switch ${s.active === false ? "" : "admin-switch--on"}"
            data-action="toggle"
            data-id="${s.id}"
          >
            <span class="admin-switch-thumb"></span>
          </button>
          <span class="admin-sponsor-status-text">
            ${s.active === false ? "Inativo" : "Ativo"}
          </span>
        </div>
        <button
          data-action="delete"
          data-id="${s.id}"
          class="admin-btn-icon admin-btn-danger"
        >
          🗑
        </button>
      </div>
    </div>
  `
      )
      .join("");



    box.innerHTML = `<div class="admin-sponsors-list">${itemsHtml}</div>`;

    box.querySelectorAll("[data-action]").forEach((btn) => {
      const id = Number(btn.getAttribute("data-id"));
      const action = btn.getAttribute("data-action");

      btn.addEventListener("click", () => {
        if (action === "delete") {
          sponsors = sponsors.filter((s) => s.id !== id);
          saveSponsors(sponsors);
          renderList(box, sponsors);
        }

        if (action === "toggle") {
          sponsors = sponsors.map((s) =>
            s.id === id ? { ...s, active: !(s.active !== false) } : s
          );
          saveSponsors(sponsors);
          renderList(box, sponsors);
        }
      });
    });
  }
}
