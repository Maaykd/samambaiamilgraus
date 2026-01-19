// assets/js/components/adminAds.js

import { db, storage } from "../firebase.js";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";

const POSITION_LABELS = {
  top: "Topo",
  middle: "Meio",
  bottom: "Final",
};

export function renderAdminAdsManager(container) {
  let ads = [];

  container.innerHTML = `
    <section class="admin-ads">
      <div class="admin-card admin-ads-form" id="admin-ads-form"></div>
      <div id="admin-ads-list"></div>
    </section>
  `;

  const formBox = container.querySelector("#admin-ads-form");
  const listBox = container.querySelector("#admin-ads-list");

  renderForm(formBox);
  renderList(listBox, ads);

  // listener em tempo real
  const colRef = collection(db, "ads");
  const q = query(colRef, orderBy("created_at", "desc"));

  onSnapshot(
    q,
    (snap) => {
      ads = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderList(listBox, ads);
    },
    (err) => {
      console.error("[ADMIN ADS] Erro no listener:", err);
      listBox.innerHTML = `
        <div class="admin-card" style="margin-top:1.5rem; text-align:center;">
          <p style="color:#ef4444;">Erro ao carregar propagandas.</p>
        </div>
      `;
    }
  );

  function renderForm(box) {
    box.innerHTML = `
      <div class="admin-ads-form-header">
        <span class="admin-ads-form-icon">➕</span>
        <h2 class="admin-content-title" id="ad-form-title">Adicionar Propaganda</h2>
      </div>

      <div class="admin-field-group">
        <label class="admin-label">Título *</label>
        <input id="ad-title" class="admin-input-full" placeholder="Título da campanha" />
      </div>

      <div class="admin-field-group">
        <label class="admin-label">Descrição</label>
        <input id="ad-description" class="admin-input-full" placeholder="Descrição curta da campanha" />
      </div>

      <div class="admin-field-group">
        <label class="admin-label">URL da Imagem *</label>
        <input id="ad-image-url" class="admin-input-full" placeholder="https://..." />
      </div>

      <div class="admin-field-group">
        <label class="admin-label">Upload de Imagem</label>
        <input id="ad-image-file" type="file" accept="image/*" class="admin-input-full" />
        <small class="admin-help-text">
          Você pode enviar um arquivo ou colar uma URL manual acima.
        </small>
      </div>

      <div class="admin-field-group">
        <label class="admin-label">Link de destino</label>
        <input id="ad-link" class="admin-input-full" placeholder="https://..." />
      </div>

      <div class="admin-field-group">
        <label class="admin-label">Posição</label>
        <select id="ad-position" class="admin-input-full">
          <option value="top">Topo</option>
          <option value="middle">Meio</option>
          <option value="bottom">Final</option>
        </select>
      </div>

      <div class="admin-field-actions">
        <button id="ad-submit-btn" class="admin-btn-primary-full admin-ads-submit">
          Adicionar Propaganda
        </button>
        <button id="ad-cancel-edit-btn" class="admin-btn-outline-small" style="display:none;">
          Cancelar Edição
        </button>
      </div>

      <p id="ad-form-status" class="admin-status"></p>
    `;

    box.style.backgroundColor = "#18181b"; // zinc-900
    box.style.border = "1px solid #27272a"; // zinc-800

    const titleEl = box.querySelector("#ad-title");
    const descEl = box.querySelector("#ad-description");
    const imageEl = box.querySelector("#ad-image-url");
    const imageFileEl = box.querySelector("#ad-image-file");
    const linkEl = box.querySelector("#ad-link");
    const positionEl = box.querySelector("#ad-position");
    const statusEl = box.querySelector("#ad-form-status");
    const submitBtn = box.querySelector("#ad-submit-btn");
    const cancelEditBtn = box.querySelector("#ad-cancel-edit-btn");
    const formTitleEl = box.querySelector("#ad-form-title");

    let editingAdId = null;

    function resetForm() {
      titleEl.value = "";
      descEl.value = "";
      imageEl.value = "";
      linkEl.value = "";
      positionEl.value = "top";
      if (imageFileEl) imageFileEl.value = "";
      editingAdId = null;
      statusEl.textContent = "";
      submitBtn.textContent = "Adicionar Propaganda";
      formTitleEl.textContent = "Adicionar Propaganda";
      cancelEditBtn.style.display = "none";
    }

    async function handleSubmit() {
      const title = titleEl.value.trim();
      const description = descEl.value.trim();
      let image_url = imageEl.value.trim();
      const link = linkEl.value.trim();
      const position = positionEl.value || "top";

      if (!title) {
        statusEl.textContent = "Preencha o título da propaganda.";
        return;
      }

      // Se não tiver URL e tiver arquivo, ainda é válido (vai gerar a URL depois)
      if (!image_url && !(imageFileEl && imageFileEl.files[0])) {
        statusEl.textContent =
          "Informe uma URL de imagem ou envie um arquivo.";
        return;
      }

      submitBtn.disabled = true;
      submitBtn.style.backgroundColor = "#16a34a"; // verde-600
      statusEl.textContent = "Salvando propaganda...";

      try {
        // upload opcional para Storage
        if (imageFileEl && imageFileEl.files && imageFileEl.files[0]) {
          const file = imageFileEl.files[0];
          const safeName = file.name.toLowerCase().replace(/\s+/g, "-");
          const path = `ads/${Date.now()}-${safeName}`;
          const storageRef = ref(storage, path);

          await uploadBytes(storageRef, file);
          image_url = await getDownloadURL(storageRef);
        }

        if (!editingAdId) {
          // criar novo
          await addDoc(colRef, {
            title,
            description,
            image_url,
            link,
            position,
            active: true,
            created_at: serverTimestamp(),
          });

          statusEl.textContent = "Propaganda adicionada!";
        } else {
          // atualizar existente
          await updateDoc(doc(colRef, editingAdId), {
            title,
            description,
            image_url,
            link,
            position,
          });

          statusEl.textContent = "Propaganda atualizada!";
        }

        setTimeout(() => (statusEl.textContent = ""), 1500);
        resetForm();
      } catch (err) {
        console.error("[ADMIN ADS] Erro ao salvar:", err);
        statusEl.textContent = "Erro ao salvar propaganda.";
      } finally {
        submitBtn.disabled = false;
        submitBtn.style.backgroundColor = "#22c55e"; // verde-500
      }
    }

    submitBtn.style.backgroundColor = "#22c55e"; // verde-500
    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleSubmit();
    });

    cancelEditBtn.addEventListener("click", (e) => {
      e.preventDefault();
      resetForm();
    });

    // função usada pela lista para preencher o form em modo edição
    box._fillFormForEditAd = (ad) => {
      titleEl.value = ad.title || "";
      descEl.value = ad.description || "";
      imageEl.value = ad.image_url || "";
      linkEl.value = ad.link || "";
      positionEl.value = ad.position || "top";
      if (imageFileEl) imageFileEl.value = "";
      editingAdId = ad.id;
      statusEl.textContent = "Editando propaganda...";
      submitBtn.textContent = "Salvar alterações";
      formTitleEl.textContent = "Editar Propaganda";
      cancelEditBtn.style.display = "inline-flex";
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  function renderList(box, list) {
    if (!list || list.length === 0) {
      box.innerHTML = `
        <div class="admin-card admin-ads-empty" style="margin-top:1.5rem; text-align:center; background:#18181b; border:1px solid #27272a;">
          <div style="font-size:2.5rem; color:#4b5563; margin-bottom:0.5rem;">🖥️</div>
          <p style="color:#9ca3af;">Nenhuma propaganda cadastrada</p>
        </div>
      `;
      return;
    }

    const itemsHtml = list
      .map(
        (ad) => `
        <div class="admin-card admin-ad-item" style="background:#18181b; border:1px solid #27272a;">
          <div class="admin-ad-main">
            <div class="admin-ad-thumb-wrapper">
              ${
                ad.image_url
                  ? `<img src="${ad.image_url}" alt="${ad.title}" class="admin-ad-thumb" />`
                  : `<div class="admin-ad-thumb admin-ad-thumb-placeholder"></div>`
              }
            </div>
            <div class="admin-ad-info">
              <h3>${ad.title || ""}</h3>
              ${
                ad.description
                  ? `<p class="admin-ad-desc">${ad.description}</p>`
                  : ""
              }
              <div class="admin-ad-meta">
                <span class="admin-ad-position-badge">
                  ${POSITION_LABELS[ad.position] || "Topo"}
                </span>
                ${
                  ad.active === false
                    ? `<span class="admin-ad-status inactive">Inativo</span>`
                    : `<span class="admin-ad-status active">Ativo</span>`
                }
              </div>
            </div>
          </div>
          <div class="admin-ad-actions">
            <button data-action="edit" data-id="${ad.id}" class="admin-btn-small">
              Editar
            </button>
            <label class="admin-ad-switch-label">
              <input type="checkbox" data-action="toggle" data-id="${ad.id}" ${
          ad.active !== false ? "checked" : ""
        } />
              <span>Ativo</span>
            </label>
            <button data-action="delete" data-id="${ad.id}" class="admin-btn-small admin-ad-delete-btn">
              🗑️
            </button>
          </div>
        </div>
      `
      )
      .join("");

    box.innerHTML = `<div class="admin-ads-list">${itemsHtml}</div>`;

    box.querySelectorAll("[data-action]").forEach((btn) => {
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");
      const ad = ads.find((a) => a.id === id);
      if (!ad) return;

      if (action === "delete") {
        btn.addEventListener("click", async () => {
          const confirmDelete = window.confirm(
            `Tem certeza que deseja excluir a propaganda "${ad.title}"?`
          );
          if (!confirmDelete) return;
          try {
            await deleteDoc(doc(db, "ads", id));
          } catch (err) {
            console.error("[ADMIN ADS] Erro ao deletar:", err);
          }
        });
      }

      if (action === "toggle") {
        btn.addEventListener("change", async (e) => {
          const newActive = e.target.checked;
          try {
            await updateDoc(doc(db, "ads", id), { active: newActive });
          } catch (err) {
            console.error("[ADMIN ADS] Erro ao alternar ativo:", err);
          }
        });
      }

      if (action === "edit") {
        btn.addEventListener("click", () => {
          if (formBox._fillFormForEditAd) {
            formBox._fillFormForEditAd(ad);
          }
        });
      }
    });
  }
}
