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
            new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg"
            })
          );
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = (err) => reject(err);

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

async function uploadNewsImage(file, title) {
  const resized = await resizeImageToJpeg(file, 1200, 630, 0.8);
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
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }));
}

// desmarca "featured" de qualquer outra notícia
async function clearOtherFeatured(currentId) {
  // só faz algo se a notícia atual estiver marcada como Principal
  // (a flag 'featured' é lida no escopo do save)
  // currentId é o id da notícia salva/atualizada
  const q = query(
    collection(db, NEWS_COLLECTION),
    where("featured", "==", true)
  );
  const snap = await getDocs(q);

  const promises = [];
  snap.forEach((docSnap) => {
    if (docSnap.id !== currentId) {
      promises.push(
        updateDoc(doc(db, NEWS_COLLECTION, docSnap.id), { featured: false })
      );
    }
  });

  if (promises.length) {
    await Promise.all(promises);
  }
}

export function renderAdminNewsManager(container) {
  container.innerHTML = `
    <div class="admin-news-wrapper">
      <div class="admin-news-header">
        <h2 class="admin-content-title">Notícias</h2>
        <p class="admin-subtitle">
          Gerencie as notícias exibidas na página pública.
        </p>
      </div>

      <div class="admin-news-layout">
        <section class="admin-card admin-news-list-card">
          <div class="admin-news-list-header">
            <h3 class="admin-section-title">Lista de notícias</h3>
            <button id="admin-news-new-btn" class="admin-btn-primary-small">
              <span>＋</span>
              <span>Nova notícia</span>
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
              <tbody id="admin-news-table-body">
                <!-- preenchido via JS -->
              </tbody>
            </table>
          </div>
        </section>

        <section class="admin-card admin-news-form-card">
          <h3 class="admin-section-title" id="admin-news-form-title">Nova notícia</h3>
          <p id="admin-news-form-status" class="admin-status"></p>

          <div class="admin-field-group">
            <label class="admin-label" for="news-title">Título</label>
            <input id="news-title" class="admin-input-full" type="text" placeholder="Título da notícia" />
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-subtitle">Subtítulo / linha de apoio</label>
            <input id="news-subtitle" class="admin-input-full" type="text" placeholder="Linha de apoio" />
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-category">Categoria</label>
            <select id="news-category" class="admin-input-full">
              <option value="">Selecione...</option>
              ${CATEGORY_OPTIONS.map(
                (c) => `<option value="${c.value}">${c.label}</option>`
              ).join("")}
            </select>
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-summary">Resumo curto</label>
            <textarea
              id="news-summary"
              class="admin-textarea"
              rows="3"
              placeholder="Texto de resumo para os cards"
            ></textarea>
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-content">Conteúdo completo</label>
            <textarea
              id="news-content"
              class="admin-textarea"
              rows="8"
              placeholder="Texto completo da notícia (pode ser HTML simples)"
            ></textarea>
          </div>

          <div class="admin-field-group">
            <label class="admin-label">Imagem da notícia</label>
            <input id="news-image-file" type="file" accept="image/*" class="admin-input-full" />
            <small class="admin-help-text">
              Envie uma imagem que será redimensionada para ~1200x630 (JPG).
            </small>
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-image-url">URL da imagem (opcional)</label>
            <input
              id="news-image-url"
              class="admin-input-full"
              type="text"
              placeholder="https://... (usado se não enviar arquivo)"
            />
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-author">Autor</label>
            <input
              id="news-author"
              class="admin-input-full"
              type="text"
              placeholder="Bidô – Samambaia Mil Graus"
            />
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-source-name">Fonte (nome)</label>
            <input
              id="news-source-name"
              class="admin-input-full"
              type="text"
              placeholder="Nome da fonte"
            />
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-source-instagram">Fonte (Instagram @)</label>
            <input
              id="news-source-instagram"
              class="admin-input-full"
              type="text"
              placeholder="@perfil"
            />
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-source-url">Fonte (URL do post/perfil)</label>
            <input
              id="news-source-url"
              class="admin-input-full"
              type="text"
              placeholder="https://instagram.com/..."
            />
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-whatsapp-share-text">Texto para compartilhar no WhatsApp</label>
            <textarea
              id="news-whatsapp-share-text"
              class="admin-textarea"
              rows="3"
              placeholder="Texto base que será usado no botão de compartilhamento"
            ></textarea>
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
            <label class="admin-checkbox">
              <input type="checkbox" id="news-featured" />
              <span>Principal</span>
            </label>
          </div>

          <div class="admin-field-group">
            <label class="admin-label" for="news-slug">Slug (URL amigável)</label>
            <input
              id="news-slug"
              class="admin-input-full"
              type="text"
              placeholder="Deixe em branco para gerar automaticamente a partir do título"
            />
          </div>

          <div class="admin-form-actions">
            <button id="admin-news-save-btn" class="admin-btn-primary-full">
              <span>💾</span>
              <span>Salvar notícia</span>
            </button>
            <button id="admin-news-cancel-btn" class="admin-btn-ghost" type="button">
              Cancelar edição
            </button>
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
  const authorEl = container.querySelector("#news-author");
  const sourceNameEl = container.querySelector("#news-source-name");
  const sourceInstagramEl = container.querySelector("#news-source-instagram");
  const sourceUrlEl = container.querySelector("#news-source-url");
  const whatsappShareTextEl = container.querySelector("#news-whatsapp-share-text");
  const publishedEl = container.querySelector("#news-published");
  const highlightEl = container.querySelector("#news-highlight");
  const featuredEl = container.querySelector("#news-featured");
  const slugEl = container.querySelector("#news-slug");

  const saveBtn = container.querySelector("#admin-news-save-btn");
  const cancelBtn = container.querySelector("#admin-news-cancel-btn");
  const newBtn = container.querySelector("#admin-news-new-btn");

  let newsList = [];
  let editingId = null;

  function resetForm() {
    editingId = null;
    formTitleEl.textContent = "Nova notícia";
    formStatusEl.textContent = "";
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

    tableBody.innerHTML = newsList
      .map((n) => {
        const catLabel =
          CATEGORY_OPTIONS.find((c) => c.value === n.category)?.label || "-";
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
        ]
          .filter(Boolean)
          .join(" ");

        return `
  <tr data-id="${n.id}">
    <td>${n.title || "-"}</td>
    <td>${catLabel}</td>
    <td>${n.created_at ? formatDateTime(n.created_at) : "-"}</td>
    <td>${statusBadges}</td>
    <td class="admin-table-actions">
      <button
        class="admin-icon-btn admin-news-edit-btn"
        type="button"
        title="Editar notícia"
      >
        ✏️
        <span>Editar</span>
      </button>
      <button
        class="admin-icon-btn admin-icon-btn-danger admin-news-delete-btn"
        type="button"
        title="Excluir notícia"
      >
        🗑
        <span>Excluir</span>
      </button>
    </td>
  </tr>
`;
      })
      .join("");

    tableBody.querySelectorAll(".admin-news-edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tr = btn.closest("tr");
        const id = tr.getAttribute("data-id");
        const item = newsList.find((n) => n.id === id);
        if (!item) return;

        editingId = id;
        formTitleEl.textContent = "Editar notícia";
        formStatusEl.textContent = "";

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
      });
    });

    tableBody.querySelectorAll(".admin-news-delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const tr = btn.closest("tr");
        const id = tr.getAttribute("data-id");
        const item = newsList.find((n) => n.id === id);
        if (!item) return;

        const ok = window.confirm(
          `Tem certeza que deseja excluir a notícia "${item.title}"?`
        );
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

  newBtn.addEventListener("click", () => {
    resetForm();
  });

  cancelBtn.addEventListener("click", () => {
    resetForm();
  });

  saveBtn.addEventListener("click", async () => {
    const title = titleEl.value.trim();
    const subtitle = subtitleEl.value.trim();
    const category = categoryEl.value || "";
    const summary = summaryEl.value.trim();
    const content = contentEl.value.trim();
    const manualImageUrl = imageUrlEl.value.trim();
    const file = imageFileEl.files[0] || null;
    const author = authorEl.value.trim() || "Bidô – Samambaia Mil Graus";
    const source_name = sourceNameEl.value.trim();
    const source_instagram = sourceInstagramEl.value.trim();
    const source_url = sourceUrlEl.value.trim();
    const whatsapp_share_text = whatsappShareTextEl.value.trim();
    const published = !!publishedEl.checked;
    const highlight = !!highlightEl.checked;
    const featured = !!featuredEl.checked;
    const slugInput = slugEl.value.trim();

    if (!title || !category || !summary || !content) {
      formStatusEl.textContent =
        "Preencha pelo menos título, categoria, resumo e conteúdo.";
      return;
    }

    formStatusEl.textContent = "Salvando notícia...";

    try {
      let finalImageUrl = manualImageUrl;
      if (file) {
        finalImageUrl = await uploadNewsImage(file, title);
        imageUrlEl.value = finalImageUrl;
        imageFileEl.value = "";
      }

      const slug = slugInput || generateSlug(title);
      const payload = {
        title,
        subtitle,
        summary,
        content,
        category,
        image_url: finalImageUrl || "",
        author,
        source_name,
        source_instagram,
        source_url,
        highlight,
        featured,
        published,
        whatsapp_share_text,
        slug,
        updated_at: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, NEWS_COLLECTION, editingId), payload);

        // se estiver marcada como Principal, limpa as outras
        if (featured) {
          await clearOtherFeatured(editingId);
        }

        formStatusEl.textContent = "Notícia atualizada com sucesso!";
      } else {
        const dataToCreate = {
          ...payload,
          created_at: serverTimestamp()
        };
        const createdRef = await addDoc(
          collection(db, NEWS_COLLECTION),
          dataToCreate
        );

        // se estiver marcada como Principal, limpa as outras
        if (featured) {
          await clearOtherFeatured(createdRef.id);
        }

        formStatusEl.textContent = "Notícia criada com sucesso!";
      }

      await refreshList();
      resetForm();
    } catch (err) {
      console.error("Erro ao salvar notícia:", err);
      formStatusEl.textContent = "Erro ao salvar notícia.";
    }

    setTimeout(() => {
      formStatusEl.textContent = "";
    }, 2500);
  });

  // inicialização
  resetForm();
  refreshList();
}
