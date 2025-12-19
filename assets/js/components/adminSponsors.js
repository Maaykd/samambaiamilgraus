// assets/js/components/adminSponsors.js
import { db, storage } from "../firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";

export function renderAdminSponsorsManager(container) {
  let sponsors = [];

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
  fetchSponsors(); // carrega do Firestore ao abrir a aba

  async function fetchSponsors() {
    try {
      const snap = await getDocs(collection(db, "sponsors"));
      sponsors = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      renderList(listBox, sponsors);
    } catch (err) {
      console.error("Erro ao carregar patrocinadores:", err);
      listBox.innerHTML = `
        <div class="admin-card" style="margin-top:1.5rem; text-align:center;">
          <p style="color:#ef4444;">Erro ao carregar patrocinadores.</p>
        </div>
      `;
    }
  }

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
        <label class="admin-label">Logo (imagem)</label>
        <input id="sponsor-logo-file" type="file" accept="image/*" class="admin-input-full" />
        <small class="admin-help-text">
          Escolha uma imagem para o logo do patrocinador.
        </small>
      </div>

      <div class="admin-field-group">
        <label class="admin-label">URL do Logo (opcional)</label>
        <input id="sponsor-logo-url" class="admin-input-full" placeholder="https://..." />
        <small class="admin-help-text">
          Se não enviar arquivo, será usada esta URL (se preenchida).
        </small>
      </div>

      <button id="sponsor-create-btn" class="admin-btn-primary-full">
        ➕ Adicionar Patrocinador
      </button>
      <p id="sponsor-form-status" class="admin-status"></p>
    `;

    const nameEl = box.querySelector("#sponsor-name");
    const instaEl = box.querySelector("#sponsor-instagram");
    const logoFileEl = box.querySelector("#sponsor-logo-file");
    const logoUrlEl = box.querySelector("#sponsor-logo-url");
    const statusEl = box.querySelector("#sponsor-form-status");

    box.querySelector("#sponsor-create-btn").addEventListener("click", async () => {
      const name = nameEl.value.trim();
      const instagram = instaEl.value.trim();
      const logoUrlManual = logoUrlEl.value.trim();
      const file = logoFileEl.files[0] || null;

      if (!name) {
        statusEl.textContent = "Preencha pelo menos o nome.";
        return;
      }

      if (!file && !logoUrlManual) {
        statusEl.textContent = "Envie uma imagem ou informe uma URL de logo.";
        return;
      }

      statusEl.textContent = "Salvando...";

      try {
        let logo_url = logoUrlManual;

        // Se tiver arquivo, faz upload para o Storage
        if (file) {
          const safeName = name.toLowerCase().replace(/\s+/g, "-");
          const fileExt = file.name.split(".").pop();
          const filePath = `sponsors/${Date.now()}-${safeName}.${fileExt}`;

          const storageRef = ref(storage, filePath);
          await uploadBytes(storageRef, file);
          logo_url = await getDownloadURL(storageRef);
        }

        const docRef = await addDoc(collection(db, "sponsors"), {
          name,
          instagram,
          logo_url,
          active: true
        });

        sponsors.push({
          id: docRef.id,
          name,
          instagram,
          logo_url,
          active: true
        });

        nameEl.value = "";
        instaEl.value = "";
        logoFileEl.value = "";
        logoUrlEl.value = "";

        statusEl.textContent = "Patrocinador adicionado!";
        setTimeout(() => (statusEl.textContent = ""), 1500);
        renderList(listBox, sponsors);
      } catch (err) {
        console.error("Erro ao adicionar patrocinador:", err);
        statusEl.textContent = "Erro ao salvar no servidor.";
      }
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
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");

      btn.addEventListener("click", async () => {
        if (action === "delete") {
          const sponsor = sponsors.find((s) => s.id === id);
          if (!sponsor) return;

          try {
            await deleteDoc(doc(db, "sponsors", sponsor.id));
            sponsors = sponsors.filter((s) => s.id !== id);
            renderList(box, sponsors);
          } catch (err) {
            console.error("Erro ao deletar patrocinador:", err);
          }
        }

        if (action === "toggle") {
          const sponsor = sponsors.find((s) => s.id === id);
          if (!sponsor) return;

          const newActive = !(sponsor.active !== false);

          try {
            await updateDoc(doc(db, "sponsors", sponsor.id), {
              active: newActive
            });

            sponsors = sponsors.map((s) =>
              s.id === id ? { ...s, active: newActive } : s
            );
            renderList(box, sponsors);
          } catch (err) {
            console.error("Erro ao atualizar patrocinador:", err);
          }
        }
      });
    });
  }
}
