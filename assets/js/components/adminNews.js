// assets/js/components/adminNews.js
import { db, storage } from "../firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
  where,
  limit,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";

const NEWS_COLLECTION = "news";

const CATEGORY_OPTIONS = [
  { value: "politica", label: "Política" },
  { value: "economia", label: "Economia" },
  { value: "seguranca", label: "Segurança" },
  { value: "cultura", label: "Cultura" },
  { value: "esportes", label: "Esportes" },
  { value: "entretenimento", label: "Entretenimento" },
  { value: "geral", label: "Geral" }
];

function escapeHtml(str) {
  return (str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function generateSlug(title) {
  return (title || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 120);
}

function formatDateTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : ts;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
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

async function resizeImageToJpeg(file, maxWidth = 1200, maxHeight = 630, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Falha ao processar imagem."));
            return;
          }
          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })
          );
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = (err) => reject(err);

    const reader = new FileReader();
    reader.onload = (e) => (img.src = e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

async function uploadNewsImage(file, title) {
  const resized = await resizeImageToJpeg(file, 1200, 630, 0.82);
  const slug = generateSlug(title) || "noticia";
  const filePath = `news/${Date.now()}-${slug}.jpg`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, resized);
  return getDownloadURL(storageRef);
}

async function loadNews() {
  const q = query(
    collection(db, NEWS_COLLECTION),
    orderBy("created_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function slugExists(slug, excludeId = null) {
  const q = query(
    collection(db, NEWS_COLLECTION),
    where("slug", "==", slug),
    limit(5)
  );
  const snap = await getDocs(q);
  const hits = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(x => (excludeId ? x.id !== excludeId : true));
  return hits.length > 0;
}

// desmarca "featured" de qualquer outra notícia
async function clearOtherFeatured(currentId) {
  const q = query(
    collection(db, NEWS_COLLECTION),
    where("featured", "==", true)
  );
  const snap = await getDocs(q);

  const promises = [];
  snap.forEach((docSnap) => {
    if (docSnap.id !== currentId) {
      promises.push(updateDoc(doc(db, NEWS_COLLECTION, docSnap.id), { featured: false }));
    }
  });

  if (promises.length) await Promise.all(promises);
}

export function renderAdminNewsManager(container) {
  container.innerHTML = `
    <div class="admin-news-wrapper">
      <div class="admin-news-header">
        <h2 class="admin-content-title">Notícias</h2>
        <p class="admin-subtitle">Gerencie as notícias exibidas na página pública.</p>
      </div>

      <div class="admin-news-layout">
        <section class="admin-card admin-news-list-card">
          <div class="admin-news-list-header">
            <h3 class="admin-section-title">Lista de notícias</h3>
            <button id="admin-news-new-btn" class="admin-btn-primary-small">
              <span>＋</span><span>Nova notícia</span>
            </button>
          </div>

          <p id="admin-news-list-status" class="admin-status"></p>

          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody id="admin-news-table-body"></tbody>
            </table>
          </div>
        </section>

        <section class="admin-card admin-news-form-card">
          <div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;flex-wrap:wrap">
            <div>
              <h3 class="admin-section-title" id="admin-news-form-title">Nova notícia</h3>
              <p id="admin-news-form-status" class="admin-status"></p>
            </div>

            <div style="display:flex;gap:0.5rem;align-items:center">
              <button id="admin-news-preview-btn" class="admin-btn-outline" type="button" title="Pré-visualizar">
                👁 <span>Preview</span>
              </button>
            </div>
          </div>

          <div class="admin-field-group" data-field="title">
            <label class="admin-label" for="news-title">Título *</label>
            <input id="news-title" class="admin-input-full" type="text" placeholder="Título da notícia" />
            <small class="admin-help-text" data-error-for="title" style="display:none;color:#fca5a5"></small>
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-subtitle">Subtítulo / linha de apoio</label>
            <input id="news-subtitle" class="admin-input-full" type="text" placeholder="Linha de apoio" />
          </div>

          <div class="admin-field-group" data-field="category">
            <label class="admin-label" for="news-category">Categoria *</label>
            <select id="news-category" class="admin-input-full">
              <option value="">Selecione...</option>
              ${CATEGORY_OPTIONS.map((c) => `<option value="${c.value}">${c.label}</option>`).join("")}
            </select>
            <small class="admin-help-text" data-error-for="category" style="display:none;color:#fca5a5"></small>
          </div>

          <div class="admin-field-group" data-field="summary">
            <label class="admin-label" for="news-summary">Resumo curto *</label>
            <textarea id="news-summary" class="admin-textarea" rows="3" placeholder="Texto de resumo para os cards"></textarea>
            <small class="admin-help-text" data-error-for="summary" style="display:none;color:#fca5a5"></small>
          </div>

          <div class="admin-field-group" data-field="content">
            <label class="admin-label" for="news-content">Conteúdo completo *</label>
            <textarea id="news-content" class="admin-textarea" rows="8" placeholder="Texto completo da notícia (pode ser HTML simples)"></textarea>
            <small class="admin-help-text" data-error-for="content" style="display:none;color:#fca5a5"></small>
          </div>

          <div class="admin-field-group">
            <label class="admin-label">Imagem da notícia</label>
            <input id="news-image-file" type="file" accept="image/*" class="admin-input-full" />
            <small class="admin-help-text">Se enviar arquivo, ele será convertido para JPG (~1200x630).</small>
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-image-url">URL da imagem (opcional)</label>
            <input id="news-image-url" class="admin-input-full" type="text" placeholder="https://... (usado se não enviar arquivo)" />
            <small class="admin-help-text" id="news-image-url-help"></small>
          </div>

          <div class="admin-field-group" style="margin-top:0.75rem">
            <label class="admin-label">Preview da imagem</label>
            <div id="news-image-preview" style="border:1px solid #27272a;background:#0b1220;border-radius:0.75rem;padding:0.75rem;display:flex;gap:0.75rem;align-items:center;min-height:72px">
              <div id="news-image-preview-thumb" style="width:96px;height:60px;border-radius:0.6rem;background:#27272a;flex:0 0 auto;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:0.8rem">Sem imagem</div>
              <div style="flex:1">
                <div id="news-image-preview-meta" style="color:#e5e7eb;font-size:0.85rem">Escolha um arquivo ou cole uma URL.</div>
                <div id="news-image-preview-sub" style="color:#9ca3af;font-size:0.78rem;margin-top:0.15rem"></div>
              </div>
            </div>
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-author">Autor</label>
            <input id="news-author" class="admin-input-full" type="text" placeholder="Bidô – Samambaia Mil Graus" />
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-source-name">Fonte (nome)</label>
            <input id="news-source-name" class="admin-input-full" type="text" placeholder="Nome da fonte" />
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-source-instagram">Fonte (Instagram @)</label>
            <input id="news-source-instagram" class="admin-input-full" type="text" placeholder="@perfil" />
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-source-url">Fonte (URL do post/perfil)</label>
            <input id="news-source-url" class="admin-input-full" type="text" placeholder="https://instagram.com/..." />
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-whatsapp-share-text">Texto para compartilhar no WhatsApp</label>
            <textarea id="news-whatsapp-share-text" class="admin-textarea" rows="3" placeholder="Texto base para compartilhamento"></textarea>
          </div>

          <div class="admin-field-group admin-field-inline">
            <label class="admin-checkbox">
              <input type="checkbox" id="news-published" />
              <span>Publicado</span>
            </label>
            <label class="admin-checkbox">
              <input type="checkbox" id="news-highlight" />
              <span>Destaque</span>
            </label>
            <label class="admin-checkbox" title="A notícia principal é única: marcar aqui vai desmarcar as outras automaticamente.">
              <input type="checkbox" id="news-featured" />
              <span>Principal</span>
            </label>
          </div>

          <div class="admin-field-group" data-field="slug">
            <label class="admin-label" for="news-slug">Slug (URL amigável)</label>

            <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
              <input id="news-slug" class="admin-input-full" type="text" placeholder="Gerado automaticamente a partir do título" style="flex:1;min-width:220px" />
              <button id="news-slug-lock-btn" class="admin-btn-outline" type="button" title="Destravar/travar slug">
                🔒 <span>Slug travado</span>
              </button>
            </div>

            <small class="admin-help-text" id="news-slug-help" style="color:#9ca3af">
              Dica: manter o slug estável evita quebrar links já compartilhados.
            </small>

            <small class="admin-help-text" data-error-for="slug" style="display:none;color:#fca5a5"></small>
          </div>

          <div class="admin-form-actions">
            <button id="admin-news-save-btn" class="admin-btn-primary-full">
              <span>💾</span><span>Salvar notícia</span>
            </button>
            <button id="admin-news-cancel-btn" class="admin-btn-ghost" type="button">Cancelar edição</button>
          </div>

          <div id="admin-news-preview-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;align-items:center;justify-content:center;padding:1rem">
            <div style="max-width:900px;width:100%;background:#020617;border:1px solid #1f2937;border-radius:1rem;overflow:hidden">
              <div style="display:flex;justify-content:space-between;align-items:center;padding:0.9rem 1rem;border-bottom:1px solid #111827">
                <div style="font-weight:800;color:#f9fafb">Preview da notícia</div>
                <button id="admin-news-preview-close" class="admin-btn-outline" type="button">Fechar</button>
              </div>
              <div id="admin-news-preview-body" style="padding:1rem;color:#e5e7eb;max-height:75vh;overflow:auto"></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;

  const listStatusEl = container.querySelector("#admin-news-list-status");
  const tableBody = container.querySelector("#admin-news-table-body");
  const formTitleEl = container.querySelector("#admin-news-form-title");
  const formStatusEl = container.querySelector("#admin-news-form-status");

  const titleEl = container.querySelector("#news-title");
  const subtitleEl = container.querySelector("#news-subtitle");
  const categoryEl = container.querySelector("#news-category");
  const summaryEl = container.querySelector("#news-summary");
  const contentEl = container.querySelector("#news-content");
  const imageFileEl = container.querySelector("#news-image-file");
  const imageUrlEl = container.querySelector("#news-image-url");
  const imageUrlHelpEl = container.querySelector("#news-image-url-help");
  const authorEl = container.querySelector("#news-author");
  const sourceNameEl = container.querySelector("#news-source-name");
  const sourceInstagramEl = container.querySelector("#news-source-instagram");
  const sourceUrlEl = container.querySelector("#news-source-url");
  const whatsappShareTextEl = container.querySelector("#news-whatsapp-share-text");
  const publishedEl = container.querySelector("#news-published");
  const highlightEl = container.querySelector("#news-highlight");
  const featuredEl = container.querySelector("#news-featured");
  const slugEl = container.querySelector("#news-slug");
  const slugLockBtn = container.querySelector("#news-slug-lock-btn");

  const previewBtn = container.querySelector("#admin-news-preview-btn");
  const previewModal = container.querySelector("#admin-news-preview-modal");
  const previewBody = container.querySelector("#admin-news-preview-body");
  const previewClose = container.querySelector("#admin-news-preview-close");

  const imagePreviewThumb = container.querySelector("#news-image-preview-thumb");
  const imagePreviewMeta = container.querySelector("#news-image-preview-meta");
  const imagePreviewSub = container.querySelector("#news-image-preview-sub");

  const saveBtn = container.querySelector("#admin-news-save-btn");
  const cancelBtn = container.querySelector("#admin-news-cancel-btn");
  const newBtn = container.querySelector("#admin-news-new-btn");

  let newsList = [];
  let editingId = null;
  let isSaving = false;

  // slug control
  let slugManualMode = false;     // usuário digitou slug manualmente ou destravou
  let slugLocked = true;          // travado = impede edição em item existente para não quebrar URL
  let originalSlug = "";          // slug original quando entrou no modo editar
  let originalPublished = false;  // usado para regras/avisos

  function setFieldError(fieldName, message) {
    const el = container.querySelector(`[data-error-for="${fieldName}"]`);
    if (!el) return;
    if (!message) {
      el.style.display = "none";
      el.textContent = "";
      return;
    }
    el.style.display = "block";
    el.textContent = message;
  }

  function clearAllErrors() {
    ["title", "category", "summary", "content", "slug"].forEach((f) => setFieldError(f, ""));
  }

  function setFormDisabled(disabled) {
    const inputs = container.querySelectorAll("input, textarea, select, button");
    inputs.forEach((el) => {
      if (el.id === "admin-news-preview-close") return;
      if (el.id === "admin-news-preview-btn") return;
      if (el.id === "admin-news-new-btn") return;
      if (el.id === "admin-news-cancel-btn") return;
      el.disabled = !!disabled;
    });

    // mantém modal funcional
    previewClose.disabled = false;

    if (disabled) {
      saveBtn.style.opacity = "0.85";
      saveBtn.style.cursor = "wait";
    } else {
      saveBtn.style.opacity = "1";
      saveBtn.style.cursor = "pointer";
    }
  }

  function updateSlugLockUi() {
    slugEl.disabled = slugLocked;
    slugLockBtn.innerHTML = slugLocked
      ? `🔒 <span>Slug travado</span>`
      : `🔓 <span>Editar slug</span>`;

    const help = container.querySelector("#news-slug-help");
    if (help) {
      help.textContent = slugLocked
        ? "Slug travado para não quebrar links. Destrave só se tiver certeza."
        : "Atenção: trocar slug pode quebrar links já compartilhados.";
      help.style.color = slugLocked ? "#9ca3af" : "#fca5a5";
    }
  }

  function updateImagePreviewFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      imagePreviewThumb.innerHTML = `<img src="${reader.result}" style="width:100%;height:100%;object-fit:cover" />`;
      imagePreviewMeta.textContent = `Arquivo selecionado: ${file.name}`;
      imagePreviewSub.textContent = `${Math.round(file.size / 1024)} KB • será convertido para JPG`;
    };
    reader.readAsDataURL(file);
  }

  function updateImagePreviewFromUrl(url) {
    if (!url) {
      imagePreviewThumb.textContent = "Sem imagem";
      imagePreviewMeta.textContent = "Escolha um arquivo ou cole uma URL.";
      imagePreviewSub.textContent = "";
      return;
    }
    if (!isValidHttpUrl(url)) {
      imagePreviewThumb.textContent = "URL inválida";
      imagePreviewMeta.textContent = "Informe uma URL http(s) válida.";
      imagePreviewSub.textContent = "";
      return;
    }
    imagePreviewThumb.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover" onerror="this.remove(); this.parentElement.textContent='Falha ao carregar';" />`;
    imagePreviewMeta.textContent = "Usando URL da imagem.";
    imagePreviewSub.textContent = url;
  }

  function getCategoryLabel(value) {
    return CATEGORY_OPTIONS.find((c) => c.value === value)?.label || "-";
  }

  function buildPreviewHtml(data) {
    const safeTitle = escapeHtml(data.title || "");
    const safeSubtitle = escapeHtml(data.subtitle || "");
    const safeSummary = escapeHtml(data.summary || "");
    const safeAuthor = escapeHtml(data.author || "");
    const safeCategory = escapeHtml(getCategoryLabel(data.category || ""));
    const img = data.image_url ? `<img src="${data.image_url}" style="width:100%;max-height:360px;object-fit:cover;border-radius:0.75rem;border:1px solid #111827" />` : "";
    // Conteúdo: você disse que pode ser HTML simples. Aqui eu mostro como HTML (sem sanitizar).
    // Se quiser segurança total, troque por escapeHtml(data.content).
    const contentHtml = data.content || "";

    return `
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem">
        <span style="padding:0.15rem 0.6rem;border-radius:999px;border:1px solid #27272a;background:#0b1220;color:#e5e7eb;font-size:0.75rem">${safeCategory}</span>
        ${data.published ? `<span style="padding:0.15rem 0.6rem;border-radius:999px;background:rgba(34,197,94,0.16);color:#4ade80;font-size:0.75rem">Publicado</span>` : `<span style="padding:0.15rem 0.6rem;border-radius:999px;background:rgba(148,163,184,0.12);color:#cbd5e1;font-size:0.75rem">Rascunho</span>`}
        ${data.highlight ? `<span style="padding:0.15rem 0.6rem;border-radius:999px;background:rgba(59,130,246,0.16);color:#93c5fd;font-size:0.75rem">Destaque</span>` : ``}
        ${data.featured ? `<span style="padding:0.15rem 0.6rem;border-radius:999px;background:rgba(245,158,11,0.16);color:#fbbf24;font-size:0.75rem">Principal</span>` : ``}
      </div>

      <h2 style="margin:0;color:#f9fafb;font-weight:900;font-size:1.6rem">${safeTitle}</h2>
      ${safeSubtitle ? `<p style="margin:0.35rem 0 0;color:#cbd5e1">${safeSubtitle}</p>` : ""}

      <div style="margin:0.9rem 0">${img}</div>

      ${safeSummary ? `<p style="margin:0 0 0.9rem;color:#e5e7eb"><strong>Resumo:</strong> ${safeSummary}</p>` : ""}

      <div style="padding:0.9rem;border:1px solid #111827;border-radius:0.75rem;background:#0b1220">
        <div style="color:#9ca3af;font-size:0.8rem;margin-bottom:0.5rem">Conteúdo</div>
        <div style="color:#e5e7eb;line-height:1.55">${contentHtml}</div>
      </div>

      <div style="margin-top:0.9rem;color:#9ca3af;font-size:0.85rem">
        Autor: ${safeAuthor || "-"} • Slug: <span style="color:#e5e7eb">${escapeHtml(data.slug || "")}</span>
      </div>
    `;
  }

  function openPreview() {
    const data = collectFormData({ includeFile: false });
    previewBody.innerHTML = buildPreviewHtml(data);
    previewModal.style.display = "flex";
  }

  function closePreview() {
    previewModal.style.display = "none";
  }

  function collectFormData({ includeFile = true } = {}) {
    const title = titleEl.value.trim();
    const subtitle = subtitleEl.value.trim();
    const category = categoryEl.value || "";
    const summary = summaryEl.value.trim();
    const content = contentEl.value.trim();
    const manualImageUrl = imageUrlEl.value.trim();
    const file = includeFile ? (imageFileEl.files[0] || null) : null;
    const author = authorEl.value.trim() || "Bidô – Samambaia Mil Graus";
    const source_name = sourceNameEl.value.trim();
    const source_instagram = sourceInstagramEl.value.trim();
    const source_url = sourceUrlEl.value.trim();
    const whatsapp_share_text = whatsappShareTextEl.value.trim();
    const published = !!publishedEl.checked;
    const highlight = !!highlightEl.checked;
    const featured = !!featuredEl.checked;

    let slug = slugEl.value.trim();
    if (!slug) slug = generateSlug(title);

    return {
      title,
      subtitle,
      category,
      summary,
      content,
      manualImageUrl,
      file,
      author,
      source_name,
      source_instagram,
      source_url,
      whatsapp_share_text,
      published,
      highlight,
      featured,
      slug
    };
  }

  function validate(data) {
    clearAllErrors();
    let ok = true;

    if (!data.title) { setFieldError("title", "Informe um título."); ok = false; }
    if (!data.category) { setFieldError("category", "Selecione uma categoria."); ok = false; }
    if (!data.summary) { setFieldError("summary", "Informe um resumo."); ok = false; }
    if (!data.content) { setFieldError("content", "Informe o conteúdo completo."); ok = false; }

    if (!data.slug) { setFieldError("slug", "Slug vazio."); ok = false; }
    else if (data.slug.length < 3) { setFieldError("slug", "Slug muito curto."); ok = false; }

    if (editingId && originalSlug && data.slug !== originalSlug) {
      setFieldError("slug", "Slug alterado: isso pode quebrar URLs já publicadas.");
      ok = false;
    }

    return ok;
  }

  function resetForm() {
    editingId = null;
    isSaving = false;

    formTitleEl.textContent = "Nova notícia";
    formStatusEl.textContent = "";
    clearAllErrors();

    titleEl.value = "";
    subtitleEl.value = "";
    categoryEl.value = "";
    summaryEl.value = "";
    contentEl.value = "";
    imageFileEl.value = "";
    imageUrlEl.value = "";
    authorEl.value = "Bidô – Samambaia Mil Graus";
    sourceNameEl.value = "";
    sourceInstagramEl.value = "";
    sourceUrlEl.value = "";
    whatsappShareTextEl.value = "";
    publishedEl.checked = false;
    highlightEl.checked = false;
    featuredEl.checked = false;
    slugEl.value = "";

    slugManualMode = false;
    slugLocked = false;   // criação: pode editar slug se quiser
    originalSlug = "";
    originalPublished = false;
    updateSlugLockUi();

    imageUrlHelpEl.textContent = "";
    updateImagePreviewFromUrl("");
    setFormDisabled(false);
  }

  function renderList() {
    if (!newsList.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5">Nenhuma notícia cadastrada ainda.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = newsList.map((n) => {
      const statusBadges = [
        n.published
          ? '<span class="admin-badge admin-badge-success">Publicado</span>'
          : '<span class="admin-badge admin-badge-muted">Rascunho</span>',
        n.highlight
          ? '<span class="admin-badge admin-badge-info">Destaque</span>'
          : "",
        n.featured
          ? '<span class="admin-badge admin-badge-warning">Principal</span>'
          : ""
      ].filter(Boolean).join(" ");

      const created = n.created_at ? formatDateTime(n.created_at) : "-";
      const title = escapeHtml(n.title || "-");

      return `
        <tr data-id="${n.id}">
          <td>${title}</td>
          <td>${escapeHtml(getCategoryLabel(n.category))}</td>
          <td>${created}</td>
          <td>${statusBadges}</td>
          <td class="admin-table-actions">
            <button class="admin-icon-btn admin-news-edit-btn" type="button" title="Editar notícia">✏️ <span>Editar</span></button>
            <button class="admin-icon-btn admin-icon-btn-danger admin-news-delete-btn" type="button" title="Excluir notícia">🗑 <span>Excluir</span></button>
          </td>
        </tr>
      `;
    }).join("");

    tableBody.querySelectorAll(".admin-news-edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tr = btn.closest("tr");
        const id = tr.getAttribute("data-id");
        const item = newsList.find((n) => n.id === id);
        if (!item) return;

        editingId = id;
        formTitleEl.textContent = "Editar notícia";
        formStatusEl.textContent = "";
        clearAllErrors();

        titleEl.value = item.title || "";
        subtitleEl.value = item.subtitle || "";
        categoryEl.value = item.category || "";
        summaryEl.value = item.summary || "";
        contentEl.value = item.content || "";
        imageFileEl.value = "";
        imageUrlEl.value = item.image_url || "";
        authorEl.value = item.author || "Bidô – Samambaia Mil Graus";
        sourceNameEl.value = item.source_name || "";
        sourceInstagramEl.value = item.source_instagram || "";
        sourceUrlEl.value = item.source_url || "";
        whatsappShareTextEl.value = item.whatsapp_share_text || "";
        publishedEl.checked = !!item.published;
        highlightEl.checked = !!item.highlight;
        featuredEl.checked = !!item.featured;
        slugEl.value = item.slug || "";

        // regras de slug pra não quebrar URL:
        originalSlug = item.slug || "";
        originalPublished = !!item.published;

        // ao editar algo existente com slug, trava por padrão
        slugLocked = !!originalSlug;
        slugManualMode = !!originalSlug; // já existe: consideramos manual/definido
        updateSlugLockUi();

        // preview da imagem
        updateImagePreviewFromUrl(item.image_url || "");
        if (item.image_url && !isValidHttpUrl(item.image_url)) {
          imageUrlHelpEl.textContent = "Atenção: a URL armazenada não parece válida.";
          imageUrlHelpEl.style.color = "#fca5a5";
        } else {
          imageUrlHelpEl.textContent = "";
        }
      });
    });

    tableBody.querySelectorAll(".admin-news-delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const tr = btn.closest("tr");
        const id = tr.getAttribute("data-id");
        const item = newsList.find((n) => n.id === id);
        if (!item) return;

        const ok = window.confirm(`Tem certeza que deseja excluir a notícia "${item.title}"?`);
        if (!ok) return;

        try {
          await deleteDoc(doc(db, NEWS_COLLECTION, id));
          newsList = newsList.filter((n) => n.id !== id);
          renderList();
        } catch (err) {
          console.error("Erro ao excluir notícia:", err);
          alert("Erro ao excluir notícia. Tente novamente.");
        }
      });
    });
  }

  async function refreshList() {
    listStatusEl.textContent = "Carregando notícias...";
    try {
      newsList = await loadNews();
      renderList();
      listStatusEl.textContent = "";
    } catch (err) {
      console.error("Erro ao carregar notícias:", err);
      listStatusEl.textContent = "Erro ao carregar notícias.";
    }
  }

  // ========= events =========

  newBtn.addEventListener("click", () => resetForm());
  cancelBtn.addEventListener("click", () => resetForm());

  // autoslug
  titleEl.addEventListener("input", () => {
    if (editingId && originalSlug) return; // em edição com slug existente, não mexe
    if (slugManualMode) return;            // usuário já está controlando o slug
    slugEl.value = generateSlug(titleEl.value);
  });

  slugEl.addEventListener("input", () => {
    if (editingId && originalSlug) return; // travado de fato na edição; input nem deveria ocorrer
    slugManualMode = true;
  });

  slugLockBtn.addEventListener("click", () => {
    // regra: se já existe slug (item antigo), só destrava mediante confirmação
    if (editingId && originalSlug) {
      if (slugLocked) {
        const ok = window.confirm(
          "ATENÇÃO: alterar o slug pode quebrar links já compartilhados.\n\nTem certeza que deseja destravar para editar?"
        );
        if (!ok) return;
        slugLocked = false;
        updateSlugLockUi();
        return;
      }
      // re-travar
      slugLocked = true;
      slugEl.value = originalSlug;
      updateSlugLockUi();
      return;
    }

    // criação: pode travar/destravar livre
    slugLocked = !slugLocked;
    updateSlugLockUi();
  });

  featuredEl.addEventListener("change", () => {
    if (featuredEl.checked) {
      const ok = window.confirm(
        'Marcar como "Principal" vai desmarcar qualquer outra notícia principal.\n\nDeseja continuar?'
      );
      if (!ok) featuredEl.checked = false;
    }
  });

  imageFileEl.addEventListener("change", () => {
    const file = imageFileEl.files[0] || null;
    if (file) {
      // se escolher arquivo, prioriza arquivo
      updateImagePreviewFromFile(file);
      imageUrlHelpEl.textContent = "Arquivo selecionado: a URL será ignorada ao salvar.";
      imageUrlHelpEl.style.color = "#9ca3af";
    } else {
      updateImagePreviewFromUrl(imageUrlEl.value.trim());
      imageUrlHelpEl.textContent = "";
    }
  });

  imageUrlEl.addEventListener("input", () => {
    const url = imageUrlEl.value.trim();
    if (imageFileEl.files[0]) return; // arquivo manda
    updateImagePreviewFromUrl(url);

    if (!url) {
      imageUrlHelpEl.textContent = "";
      return;
    }
    if (!isValidHttpUrl(url)) {
      imageUrlHelpEl.textContent = "URL inválida (precisa começar com http/https).";
      imageUrlHelpEl.style.color = "#fca5a5";
      return;
    }
    imageUrlHelpEl.textContent = "URL válida.";
    imageUrlHelpEl.style.color = "#a3e635";
  });

  previewBtn.addEventListener("click", () => openPreview());
  previewClose.addEventListener("click", () => closePreview());
  previewModal.addEventListener("click", (e) => {
    if (e.target === previewModal) closePreview();
  });

  saveBtn.addEventListener("click", async () => {
    if (isSaving) return;

    const data = collectFormData({ includeFile: true });

    // regra adicional: se estiver editando e o slug estava travado, forçamos slug original
    if (editingId && originalSlug) {
      data.slug = originalSlug;
      slugEl.value = originalSlug;
    }

    if (!validate(data)) return;

    // slug único (na criação ou em edit sem slug original)
    if (!editingId || !originalSlug) {
      const exists = await slugExists(data.slug, editingId || null);
      if (exists) {
        setFieldError("slug", "Já existe uma notícia com esse slug. Troque o slug (ou altere o título).");
        return;
      }
    }

    isSaving = true;
    setFormDisabled(true);
    formStatusEl.textContent = "Salvando notícia...";

    try {
      let finalImageUrl = data.manualImageUrl || "";

      if (data.file) {
        finalImageUrl = await uploadNewsImage(data.file, data.title);
        imageUrlEl.value = finalImageUrl;
        imageFileEl.value = "";
      }

      const payload = {
        title: data.title,
        subtitle: data.subtitle,
        summary: data.summary,
        content: data.content,
        category: data.category,
        image_url: finalImageUrl || "",
        author: data.author,
        source_name: data.source_name,
        source_instagram: data.source_instagram,
        source_url: data.source_url,
        highlight: data.highlight,
        featured: data.featured,
        published: data.published,
        whatsapp_share_text: data.whatsapp_share_text,
        slug: data.slug,
        updated_at: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, NEWS_COLLECTION, editingId), payload);

        if (data.featured) {
          await clearOtherFeatured(editingId);
        }

        formStatusEl.textContent = "Notícia atualizada com sucesso!";
      } else {
        const dataToCreate = { ...payload, created_at: serverTimestamp() };
        const createdRef = await addDoc(collection(db, NEWS_COLLECTION), dataToCreate);

        if (data.featured) {
          await clearOtherFeatured(createdRef.id);
        }

        formStatusEl.textContent = "Notícia criada com sucesso!";
      }

      await refreshList();
      resetForm();
    } catch (err) {
      console.error("Erro ao salvar notícia:", err);
      formStatusEl.textContent = "Erro ao salvar notícia.";
    } finally {
      isSaving = false;
      setFormDisabled(false);
      setTimeout(() => (formStatusEl.textContent = ""), 2500);
    }
  });

  // inicialização
  resetForm();
  refreshList();
}
