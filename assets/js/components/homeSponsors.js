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

function escapeHtml(str) {
  return (str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidHttpUrl(s) {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeHandle(insta) {
  const v = (insta || "").trim();
  if (!v) return "";
  return v.startsWith("@") ? v : `@${v}`;
}

function getInitials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const a = parts[0][0] || "?";
  const b = parts.length > 1 ? (parts[parts.length - 1][0] || "") : "";
  return (a + b).toUpperCase();
}

function sortSponsors(list) {
  // Ativos primeiro, depois por nome
  return [...list].sort((a, b) => {
    const aActive = a.active !== false;
    const bActive = b.active !== false;
    if (aActive !== bActive) return aActive ? -1 : 1;
    return (a.name || "").localeCompare((b.name || ""), "pt-BR", { sensitivity: "base" });
  });
}

export function renderAdminSponsorsManager(container) {
  let sponsors = [];
  let filtered = [];
  let editingId = null;
  let isSaving = false;

  container.innerHTML = `
    <section class="admin-sponsors">
      <div class="admin-card" id="admin-sponsors-form"></div>

      <div class="admin-card" style="margin-top:1.25rem" id="admin-sponsors-toolbar"></div>

      <div id="admin-sponsors-list"></div>
    </section>
  `;

  const formBox = container.querySelector("#admin-sponsors-form");
  const toolbarBox = container.querySelector("#admin-sponsors-toolbar");
  const listBox = container.querySelector("#admin-sponsors-list");

  renderForm(formBox);
  renderToolbar(toolbarBox);
  renderList(listBox, []);
  fetchSponsors();

  async function fetchSponsors() {
    listBox.innerHTML = `
      <div class="admin-card" style="margin-top:1.25rem; text-align:center;">
        <p style="color:#9ca3af;">Carregando patrocinadores...</p>
      </div>
    `;
    try {
      const snap = await getDocs(collection(db, "sponsors"));
      sponsors = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      sponsors = sortSponsors(sponsors);
      applyFilters();
    } catch (err) {
      console.error("Erro ao carregar patrocinadores:", err);
      listBox.innerHTML = `
        <div class="admin-card" style="margin-top:1.25rem; text-align:center;">
          <p style="color:#ef4444;">Erro ao carregar patrocinadores.</p>
        </div>
      `;
    }
  }

  function setSaving(flag) {
    isSaving = !!flag;
    const inputs = formBox.querySelectorAll("input, button");
    inputs.forEach(el => (el.disabled = isSaving));
    const btn = formBox.querySelector("#sponsor-submit-btn");
    if (btn) {
      btn.style.opacity = isSaving ? "0.85" : "1";
      btn.style.cursor = isSaving ? "wait" : "pointer";
    }
  }

  function renderForm(box) {
    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;flex-wrap:wrap">
        <div>
          <h2 class="admin-content-title" id="sponsor-form-title">Adicionar Patrocinador</h2>
          <p style="color:#9ca3af;font-size:0.85rem;margin-top:-1rem">Crie ou edite patrocinadores do carrossel.</p>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center">
          <button id="sponsor-reset-btn" class="admin-btn-outline" type="button">Limpar</button>
        </div>
      </div>

      <div class="admin-field-group" data-field="name">
        <label class="admin-label">Nome *</label>
        <input id="sponsor-name" class="admin-input-full" placeholder="Nome da marca" />
        <small class="admin-help-text" id="sponsor-err-name" style="display:none;color:#fca5a5"></small>
      </div>

      <div class="admin-field-group">
        <label class="admin-label">Instagram (@)</label>
        <input id="sponsor-instagram" class="admin-input-full" placeholder="@marca" />
        <small class="admin-help-text" style="color:#9ca3af">Pode digitar com ou sem @.</small>
      </div>

      <div class="admin-field-group">
        <label class="admin-label">Logo (imagem)</label>
        <input id="sponsor-logo-file" type="file" accept="image/*" class="admin-input-full" />
        <small class="admin-help-text">Se enviar arquivo, ele terá prioridade sobre a URL.</small>
      </div>

      <div class="admin-field-group">
        <label class="admin-label">URL do Logo (opcional)</label>
        <input id="sponsor-logo-url" class="admin-input-full" placeholder="https://..." />
        <small class="admin-help-text" id="sponsor-logo-url-help"></small>
      </div>

      <div class="admin-field-group" style="margin-top:0.75rem">
        <label class="admin-label">Preview do logo</label>
        <div id="sponsor-logo-preview" style="border:1px solid #27272a;background:#0b1220;border-radius:0.75rem;padding:0.75rem;display:flex;gap:0.75rem;align-items:center;min-height:72px">
          <div id="sponsor-logo-thumb" style="width:96px;height:60px;border-radius:0.6rem;background:#27272a;flex:0 0 auto;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:0.8rem">
            Sem logo
          </div>
          <div style="flex:1">
            <div id="sponsor-logo-meta" style="color:#e5e7eb;font-size:0.85rem">Selecione um arquivo ou cole uma URL.</div>
            <div id="sponsor-logo-sub" style="color:#9ca3af;font-size:0.78rem;margin-top:0.15rem"></div>
          </div>
        </div>
      </div>

      <div class="admin-field-group admin-field-inline" style="margin-top:1rem">
        <label class="admin-checkbox">
          <input type="checkbox" id="sponsor-active" checked />
          <span>Ativo</span>
        </label>
      </div>

      <button id="sponsor-submit-btn" class="admin-btn-primary-full">➕ Adicionar Patrocinador</button>
      <p id="sponsor-form-status" class="admin-status"></p>
    `;

    const titleEl = box.querySelector("#sponsor-form-title");
    const nameEl = box.querySelector("#sponsor-name");
    const instaEl = box.querySelector("#sponsor-instagram");
    const logoFileEl = box.querySelector("#sponsor-logo-file");
    const logoUrlEl = box.querySelector("#sponsor-logo-url");
    const logoUrlHelpEl = box.querySelector("#sponsor-logo-url-help");
    const activeEl = box.querySelector("#sponsor-active");
    const statusEl = box.querySelector("#sponsor-form-status");
    const errNameEl = box.querySelector("#sponsor-err-name");

    const thumb = box.querySelector("#sponsor-logo-thumb");
    const meta = box.querySelector("#sponsor-logo-meta");
    const sub = box.querySelector("#sponsor-logo-sub");

    function clearErrors() {
      errNameEl.style.display = "none";
      errNameEl.textContent = "";
    }

    function resetForm() {
      editingId = null;
      titleEl.textContent = "Adicionar Patrocinador";
      box.querySelector("#sponsor-submit-btn").innerHTML = "➕ Adicionar Patrocinador";
      statusEl.textContent = "";
      clearErrors();

      nameEl.value = "";
      instaEl.value = "";
      logoFileEl.value = "";
      logoUrlEl.value = "";
      activeEl.checked = true;

      logoUrlHelpEl.textContent = "";
      thumb.textContent = "Sem logo";
      meta.textContent = "Selecione um arquivo ou cole uma URL.";
      sub.textContent = "";
    }

    function setPreviewFromFile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        thumb.innerHTML = `<img src="${reader.result}" style="width:100%;height:100%;object-fit:cover" />`;
        meta.textContent = `Arquivo selecionado: ${file.name}`;
        sub.textContent = `${Math.round(file.size / 1024)} KB`;
      };
      reader.readAsDataURL(file);
    }

    function setPreviewFromUrl(url) {
      if (!url) {
        thumb.textContent = "Sem logo";
        meta.textContent = "Selecione um arquivo ou cole uma URL.";
        sub.textContent = "";
        return;
      }
      if (!isValidHttpUrl(url)) {
        thumb.textContent = "URL inválida";
        meta.textContent = "Informe uma URL http(s) válida.";
        sub.textContent = "";
        return;
      }
      thumb.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover" onerror="this.remove(); this.parentElement.textContent='Falha ao carregar';" />`;
      meta.textContent = "Usando URL do logo.";
      sub.textContent = url;
    }

    box.querySelector("#sponsor-reset-btn").addEventListener("click", () => resetForm());

    logoFileEl.addEventListener("change", () => {
      const file = logoFileEl.files[0] || null;
      if (file) {
        setPreviewFromFile(file);
        logoUrlHelpEl.textContent = "Arquivo selecionado: a URL será ignorada ao salvar.";
        logoUrlHelpEl.style.color = "#9ca3af";
      } else {
        setPreviewFromUrl(logoUrlEl.value.trim());
        logoUrlHelpEl.textContent = "";
      }
    });

    logoUrlEl.addEventListener("input", () => {
      const url = logoUrlEl.value.trim();
      if (logoFileEl.files[0]) return; // arquivo manda
      setPreviewFromUrl(url);

      if (!url) {
        logoUrlHelpEl.textContent = "";
        return;
      }
      if (!isValidHttpUrl(url)) {
        logoUrlHelpEl.textContent = "URL inválida (precisa começar com http/https).";
        logoUrlHelpEl.style.color = "#fca5a5";
        return;
      }
      logoUrlHelpEl.textContent = "URL válida.";
      logoUrlHelpEl.style.color = "#a3e635";
    });

    box.querySelector("#sponsor-submit-btn").addEventListener("click", async () => {
      if (isSaving) return;

      const name = nameEl.value.trim();
      const instagram = normalizeHandle(instaEl.value);
      const manualUrl = logoUrlEl.value.trim();
      const file = logoFileEl.files[0] || null;
      const active = !!activeEl.checked;

      clearErrors();

      if (!name) {
        errNameEl.textContent = "Informe o nome do patrocinador.";
        errNameEl.style.display = "block";
        return;
      }

      if (!file && !manualUrl && !editingId) {
        statusEl.textContent = "Envie uma imagem ou informe uma URL de logo.";
        return;
      }

      if (manualUrl && !isValidHttpUrl(manualUrl)) {
        statusEl.textContent = "A URL do logo parece inválida.";
        statusEl.style.color = "#fca5a5";
        return;
      }
      statusEl.style.color = "";

      statusEl.textContent = editingId ? "Atualizando..." : "Salvando...";
      setSaving(true);

      try {
        let logo_url = manualUrl;

        // Upload do arquivo se tiver (prioridade)
        if (file) {
          const safeName = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
          const fileExt = (file.name.split(".").pop() || "png").toLowerCase();
          const filePath = `sponsors/${Date.now()}-${safeName}.${fileExt}`;
          const storageRef = ref(storage, filePath);
          await uploadBytes(storageRef, file);
          logo_url = await getDownloadURL(storageRef);
        }

        // Em edição: se não escolheu arquivo nem url manual, mantém o que já está salvo
        if (editingId) {
          const current = sponsors.find(s => s.id === editingId);
          if (!logo_url) logo_url = current?.logo_url || "";

          await updateDoc(doc(db, "sponsors", editingId), {
            name,
            instagram,
            logo_url,
            active
          });

          sponsors = sponsors.map(s => s.id === editingId ? { ...s, name, instagram, logo_url, active } : s);
          sponsors = sortSponsors(sponsors);
          applyFilters();

          statusEl.textContent = "Patrocinador atualizado!";
          setTimeout(() => (statusEl.textContent = ""), 1500);
          resetForm();
          return;
        }

        // Criação
        if (!logo_url) {
          statusEl.textContent = "Envie um logo (arquivo) ou preencha uma URL.";
          return;
        }

        const docRef = await addDoc(collection(db, "sponsors"), {
          name,
          instagram,
          logo_url,
          active: true // padrão
        });

        sponsors.push({ id: docRef.id, name, instagram, logo_url, active: true });
        sponsors = sortSponsors(sponsors);
        applyFilters();

        statusEl.textContent = "Patrocinador adicionado!";
        setTimeout(() => (statusEl.textContent = ""), 1500);
        resetForm();
      } catch (err) {
        console.error("Erro ao salvar patrocinador:", err);
        statusEl.textContent = "Erro ao salvar no servidor.";
        statusEl.style.color = "#fca5a5";
      } finally {
        setSaving(false);
      }
    });

    // Expor pro escopo externo
    box._resetSponsorForm = resetForm;
    box._fillSponsorForm = (sponsor) => {
      editingId = sponsor.id;

      titleEl.textContent = "Editar Patrocinador";
      box.querySelector("#sponsor-submit-btn").innerHTML = "💾 Salvar alterações";
      statusEl.textContent = "";
      clearErrors();

      nameEl.value = sponsor.name || "";
      instaEl.value = sponsor.instagram || "";
      logoFileEl.value = "";
      logoUrlEl.value = sponsor.logo_url || "";
      activeEl.checked = sponsor.active !== false;

      if (sponsor.logo_url) setPreviewFromUrl(sponsor.logo_url);
      else {
        thumb.textContent = "Sem logo";
        meta.textContent = "Selecione um arquivo ou cole uma URL.";
        sub.textContent = "";
      }

      logoUrlHelpEl.textContent = sponsor.logo_url ? "Logo atual carregado pela URL." : "";
      logoUrlHelpEl.style.color = "#9ca3af";
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  function renderToolbar(box) {
    box.innerHTML = `
      <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;justify-content:space-between">
        <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap">
          <div class="admin-field-group" style="margin:0;min-width:240px">
            <label class="admin-label" style="margin-bottom:0.35rem">Buscar</label>
            <input id="sponsor-search" class="admin-input-full" placeholder="Digite para filtrar por nome..." />
          </div>

          <div class="admin-field-group" style="margin:0;min-width:200px">
            <label class="admin-label" style="margin-bottom:0.35rem">Filtro</label>
            <select id="sponsor-filter" class="admin-input-full">
              <option value="all">Todos</option>
              <option value="active">Somente ativos</option>
              <option value="inactive">Somente inativos</option>
            </select>
          </div>
        </div>

        <div style="color:#9ca3af;font-size:0.85rem">
          <span id="sponsor-count">0</span> patrocinadores
        </div>
      </div>
    `;

    const searchEl = box.querySelector("#sponsor-search");
    const filterEl = box.querySelector("#sponsor-filter");

    searchEl.addEventListener("input", () => applyFilters());
    filterEl.addEventListener("change", () => applyFilters());
  }

  function applyFilters() {
    const search = (toolbarBox.querySelector("#sponsor-search")?.value || "").trim().toLowerCase();
    const filter = toolbarBox.querySelector("#sponsor-filter")?.value || "all";

    filtered = sponsors.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const matchSearch = !search || name.includes(search);

      const isActive = s.active !== false;
      const matchFilter =
        filter === "all" ? true :
        filter === "active" ? isActive :
        !isActive;

      return matchSearch && matchFilter;
    });

    toolbarBox.querySelector("#sponsor-count").textContent = String(filtered.length);
    renderList(listBox, filtered);
  }

  function renderList(box, list) {
    if (!list || list.length === 0) {
      box.innerHTML = `
        <div class="admin-card" style="margin-top:1.25rem; text-align:center;">
          <p style="color:#6b7280;">Nenhum patrocinador encontrado.</p>
        </div>
      `;
      return;
    }

    const itemsHtml = list.map((s) => {
      const isActive = s.active !== false;
      const avatar = s.logo_url
        ? `<img src="${escapeHtml(s.logo_url)}" alt="${escapeHtml(s.name || "logo")}" style="width:3rem;height:3rem;border-radius:999px;object-fit:cover;border:1px solid #27272a" onerror="this.remove(); this.parentElement.textContent='${escapeHtml(getInitials(s.name))}';" />`
        : `<div class="admin-sponsor-avatar">${escapeHtml(getInitials(s.name))}</div>`;

      return `
        <div class="admin-card admin-sponsor-item" data-id="${s.id}">
          <div class="admin-sponsor-main">
            ${avatar}
            <div class="admin-sponsor-info">
              <h3>${escapeHtml(s.name || "-")}</h3>
              <p class="admin-sponsor-handle">${escapeHtml(s.instagram || "")}</p>
            </div>
          </div>

          <div class="admin-sponsor-footer">
            <div class="admin-sponsor-toggle">
              <button
                class="admin-switch ${isActive ? "admin-switch--on" : ""}"
                data-action="toggle"
                data-id="${s.id}"
                title="Ativar/Desativar"
              >
                <span class="admin-switch-thumb"></span>
              </button>
              <span class="admin-sponsor-status-text">${isActive ? "Ativo" : "Inativo"}</span>
            </div>

            <div style="display:flex;gap:0.4rem;align-items:center">
              <button class="admin-icon-btn" data-action="edit" data-id="${s.id}" type="button" title="Editar">
                ✏️ <span>Editar</span>
              </button>
              <button class="admin-btn-icon admin-btn-danger" data-action="delete" data-id="${s.id}" type="button" title="Excluir">
                🗑
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    box.innerHTML = `<div class="admin-sponsors-list">${itemsHtml}</div>`;

    box.querySelectorAll("[data-action]").forEach((btn) => {
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");

      btn.addEventListener("click", async () => {
        if (action === "edit") {
          const sponsor = sponsors.find((s) => s.id === id);
          if (!sponsor) return;
          formBox._fillSponsorForm?.(sponsor);
          return;
        }

        if (action === "delete") {
          const sponsor = sponsors.find((s) => s.id === id);
          if (!sponsor) return;

          const ok = window.confirm(`Excluir patrocinador "${sponsor.name}"?`);
          if (!ok) return;

          try {
            await deleteDoc(doc(db, "sponsors", sponsor.id));
            sponsors = sponsors.filter((s) => s.id !== id);
            sponsors = sortSponsors(sponsors);
            applyFilters();

            // se estava editando o mesmo, limpa
            if (editingId === id) formBox._resetSponsorForm?.();
          } catch (err) {
            console.error("Erro ao deletar patrocinador:", err);
            alert("Erro ao deletar patrocinador.");
          }
          return;
        }

        if (action === "toggle") {
          const sponsor = sponsors.find((s) => s.id === id);
          if (!sponsor) return;

          const newActive = !(sponsor.active !== false);

          try {
            await updateDoc(doc(db, "sponsors", sponsor.id), { active: newActive });
            sponsors = sponsors.map((s) => (s.id === id ? { ...s, active: newActive } : s));
            sponsors = sortSponsors(sponsors);
            applyFilters();
          } catch (err) {
            console.error("Erro ao atualizar patrocinador:", err);
            alert("Erro ao atualizar patrocinador.");
          }
        }
      });
    });
  }
}
