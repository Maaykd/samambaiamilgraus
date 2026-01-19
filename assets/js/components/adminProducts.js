// assets/js/components/adminProducts.js

import { db, storage } from "../firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";
import { getPriceNumber, formatCurrency } from "../utils/format.js";

const CATEGORY_LABELS = {
  roupas: "Roupas",
  acessorios: "Acessórios",
  canecas: "Canecas",
  outros: "Outros",
};

export function renderAdminProductsManager(container) {
  let products = [];
  let editingProductId = null; // null = criando, string = editando
  let searchTerm = "";
  let filterCategory = "all";

  container.innerHTML = `
    <section class="admin-products">
      <div class="admin-card" id="admin-products-form"></div>
      <div id="admin-products-list"></div>
    </section>
  `;

  const formBox = container.querySelector("#admin-products-form");
  const listBox = container.querySelector("#admin-products-list");

  renderForm(formBox);
  renderList(listBox, applyFilters());

  // Carrega produtos do Firestore ao abrir o admin
  fetchProducts();

  async function fetchProducts() {
    try {
      const snap = await getDocs(collection(db, "products"));
      products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("[ADMIN] Produtos do Firestore:", products);
      renderList(listBox, applyFilters());
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      listBox.innerHTML = `
        <div class="admin-card" style="margin-top:1.5rem; text-align:center;">
          <p style="color:#ef4444;">Erro ao carregar produtos.</p>
        </div>
      `;
    }
  }

  function applyFilters() {
    const term = (searchTerm || "").toLowerCase();
    return products.filter((p) => {
      const matchesName = p.name
        ? p.name.toLowerCase().includes(term)
        : false;
      const matchesCategory =
        filterCategory === "all" || p.category === filterCategory;
      return matchesName && matchesCategory;
    });
  }

  function resetFormFields(box) {
    const nameEl = box.querySelector("#prod-name");
    const priceEl = box.querySelector("#prod-price");
    const descEl = box.querySelector("#prod-description");
    const imageEl = box.querySelector("#prod-image");
    const fileEl = box.querySelector("#prod-image-file");
    const catEl = box.querySelector("#prod-category");
    const statusEl = box.querySelector("#prod-form-status");

    nameEl.value = "";
    priceEl.value = "";
    descEl.value = "";
    imageEl.value = "";
    if (fileEl) fileEl.value = "";
    catEl.value = "outros";
    editingProductId = null;
    statusEl.textContent = "";
    box.querySelector("#prod-submit-btn").textContent = "➕ Adicionar Produto";
    box.querySelector("#prod-form-title").textContent = "Adicionar Produto";
  }

  function fillFormForEdit(box, product) {
    const nameEl = box.querySelector("#prod-name");
    const priceEl = box.querySelector("#prod-price");
    const descEl = box.querySelector("#prod-description");
    const imageEl = box.querySelector("#prod-image");
    const fileEl = box.querySelector("#prod-image-file");
    const catEl = box.querySelector("#prod-category");
    const statusEl = box.querySelector("#prod-form-status");

    nameEl.value = product.name || "";
    priceEl.value =
      product.price != null ? String(product.price).replace(".", ",") : "";
    descEl.value = product.description || "";
    imageEl.value = product.image_url || "";
    if (fileEl) fileEl.value = "";
    catEl.value = product.category || "outros";
    editingProductId = product.id;
    statusEl.textContent = "Editando produto...";
    box.querySelector("#prod-submit-btn").textContent = "💾 Salvar Alterações";
    box.querySelector("#prod-form-title").textContent = "Editar Produto";
  }

  function renderForm(box) {
    box.innerHTML = `
      <h2 id="prod-form-title" class="admin-content-title">Adicionar Produto</h2>
      <div class="admin-field-group">
        <label class="admin-label">Nome *</label>
        <input id="prod-name" class="admin-input-full" placeholder="Nome do produto" />
      </div>
      <div class="admin-field-group">
        <label class="admin-label">Preço (R$) *</label>
        <input id="prod-price" class="admin-input-full" type="text" placeholder="99,90" />
      </div>
      <div class="admin-field-group">
        <label class="admin-label">Descrição</label>
        <textarea id="prod-description" class="admin-textarea" rows="3" placeholder="Descrição do produto..."></textarea>
      </div>
      <div class="admin-field-group">
        <label class="admin-label">URL da Imagem</label>
        <input id="prod-image" class="admin-input-full" placeholder="https://..." />
        <small class="admin-help-text">
          Você pode colar uma URL manual ou selecionar um arquivo abaixo para enviar ao Storage.
        </small>
      </div>
      <div class="admin-field-group">
        <label class="admin-label">Upload de Imagem</label>
        <input id="prod-image-file" type="file" accept="image/*" class="admin-input-full" />
      </div>
      <div class="admin-field-group">
        <label class="admin-label">Categoria</label>
        <select id="prod-category" class="admin-input-full">
          <option value="roupas">Roupas</option>
          <option value="acessorios">Acessórios</option>
          <option value="canecas">Canecas</option>
          <option value="outros">Outros</option>
        </select>
      </div>
      <div class="admin-field-actions">
        <button id="prod-submit-btn" class="admin-btn-primary-full">
          ➕ Adicionar Produto
        </button>
        <button id="prod-cancel-edit-btn" class="admin-btn-outline-small" style="display:none;">
          Cancelar Edição
        </button>
      </div>
      <p id="prod-form-status" class="admin-status"></p>
    `;

    const nameEl = box.querySelector("#prod-name");
    const priceEl = box.querySelector("#prod-price");
    const descEl = box.querySelector("#prod-description");
    const imageEl = box.querySelector("#prod-image");
    const fileEl = box.querySelector("#prod-image-file");
    const catEl = box.querySelector("#prod-category");
    const statusEl = box.querySelector("#prod-form-status");
    const submitBtn = box.querySelector("#prod-submit-btn");
    const cancelEditBtn = box.querySelector("#prod-cancel-edit-btn");

    submitBtn.addEventListener("click", async () => {
      const name = nameEl.value.trim();
      const priceNumber = getPriceNumber(priceEl.value);

      if (!name || priceNumber == null) {
        statusEl.textContent = "Preencha pelo menos nome e preço válidos.";
        return;
      }

      statusEl.textContent = "Salvando...";

      try {
        // Decide a imagem: começa pela URL digitada
        let imageUrl = imageEl.value.trim();

        // Se tiver arquivo selecionado, faz upload e sobrescreve imageUrl
        if (fileEl && fileEl.files && fileEl.files[0]) {
          const file = fileEl.files[0];
          const safeName = file.name.toLowerCase().replace(/\s+/g, "-");
          const path = `productImages/${Date.now()}-${safeName}`;
          const storageRef = ref(storage, path);

          await uploadBytes(storageRef, file);
          imageUrl = await getDownloadURL(storageRef);
        }

        const prodData = {
          name,
          description: descEl.value.trim(),
          price: priceNumber,
          image_url: imageUrl,
          category: catEl.value || "outros",
          active: true,
        };

        if (!editingProductId) {
          // Criar novo
          const docRef = await addDoc(collection(db, "products"), prodData);
          const prod = { id: docRef.id, ...prodData };
          products.push(prod);
          statusEl.textContent = "Produto adicionado!";
        } else {
          // Atualizar existente
          await updateDoc(doc(db, "products", editingProductId), prodData);
          products = products.map((p) =>
            p.id === editingProductId ? { id: p.id, ...prodData } : p
          );
          statusEl.textContent = "Produto atualizado!";
        }

        setTimeout(() => (statusEl.textContent = ""), 1500);
        renderList(listBox, applyFilters());
        resetFormFields(box);
        cancelEditBtn.style.display = "none";
      } catch (err) {
        console.error("Erro ao salvar produto:", err);
        statusEl.textContent = "Erro ao salvar no servidor.";
      }
    });

    cancelEditBtn.addEventListener("click", () => {
      resetFormFields(box);
      cancelEditBtn.style.display = "none";
    });

    // Expor função para uso pela lista (preencher/cancelar edição)
    box._fillFormForEdit = (product) => {
      fillFormForEdit(box, product);
      cancelEditBtn.style.display = "inline-flex";
    };
  }

  function renderList(box, list) {
    const hasProducts = products && products.length > 0;

    if (!hasProducts) {
      box.innerHTML = `
        <div class="admin-card" style="margin-top:1.5rem; text-align:center;">
          <p style="color:#6b7280;">Nenhum produto cadastrado</p>
        </div>
      `;
      return;
    }

    const itemsHtml =
      list && list.length
        ? list
            .map(
              (p) => `
          <div class="admin-card admin-product-item">
            <div class="admin-product-main">
              ${
                p.image_url
                  ? `<img src="${p.image_url}" alt="${p.name}" class="admin-product-thumb">`
                  : ""
              }
              <div class="admin-product-info">
                <h3>${p.name}</h3>
                <p class="admin-product-desc">${p.description || ""}</p>
                <div class="admin-product-meta">
                  <span class="admin-product-price">
                    ${formatCurrency(p.price)}
                  </span>
                  ${
                    p.category
                      ? `<span class="admin-product-tag">${
                          CATEGORY_LABELS[p.category] || p.category
                        }</span>`
                      : ""
                  }
                  <span class="admin-product-status ${
                    p.active === false ? "inactive" : "active"
                  }">
                    ${p.active === false ? "Inativo" : "Ativo"}
                  </span>
                </div>
              </div>
            </div>
            <div class="admin-product-actions">
              <button data-action="edit" data-id="${p.id}" class="admin-btn-small">
                Editar
              </button>
              <button data-action="toggle" data-id="${p.id}" class="admin-btn-small">
                ${p.active === false ? "Ativar" : "Desativar"}
              </button>
              <button data-action="delete" data-id="${p.id}" class="admin-btn-small admin-btn-danger">
                Excluir
              </button>
            </div>
          </div>
        `
            )
            .join("")
        : `
        <div class="admin-card" style="margin-top:1.5rem; text-align:center;">
          <p style="color:#6b7280;">Nenhum produto encontrado com os filtros atuais.</p>
        </div>
      `;

    box.innerHTML = `
      <div class="admin-products-toolbar">
        <div class="admin-products-toolbar-left">
          <input
            id="admin-prod-search"
            class="admin-input-full admin-input-search"
            type="text"
            placeholder="Buscar por nome..."
            value="${searchTerm}"
          />
        </div>
        <div class="admin-products-toolbar-right">
          <select id="admin-prod-filter-category" class="admin-input-full">
            <option value="all">Todas as categorias</option>
            <option value="roupas">Roupas</option>
            <option value="acessorios">Acessórios</option>
            <option value="canecas">Canecas</option>
            <option value="outros">Outros</option>
          </select>
        </div>
      </div>

      <div class="admin-products-list">
        ${itemsHtml}
      </div>
    `;

    const searchInput = box.querySelector("#admin-prod-search");
    const categorySelect = box.querySelector("#admin-prod-filter-category");

    if (categorySelect) {
      categorySelect.value = filterCategory;
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchTerm = e.target.value || "";
        renderList(box, applyFilters());
      });
    }

    if (categorySelect) {
      categorySelect.addEventListener("change", (e) => {
        filterCategory = e.target.value || "all";
        renderList(box, applyFilters());
      });
    }

    box.querySelectorAll("[data-action]").forEach((btn) => {
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");

      btn.addEventListener("click", async () => {
        const product = products.find((p) => p.id === id);
        if (!product) return;

        if (action === "delete") {
          const confirmDelete = window.confirm(
            `Tem certeza que deseja excluir o produto "${product.name}"?`
          );
          if (!confirmDelete) return;

          try {
            await deleteDoc(doc(db, "products", id));
            products = products.filter((p) => p.id !== id);
            renderList(box, applyFilters());
          } catch (err) {
            console.error("Erro ao deletar produto:", err);
          }
        }

        if (action === "toggle") {
          const newActive = !(product.active !== false);
          try {
            await updateDoc(doc(db, "products", id), { active: newActive });
            products = products.map((p) =>
              p.id === id ? { ...p, active: newActive } : p
            );
            renderList(box, applyFilters());
          } catch (err) {
            console.error("Erro ao atualizar produto:", err);
          }
        }

        if (action === "edit") {
          if (formBox._fillFormForEdit) {
            formBox._fillFormForEdit(product);
          }
        }
      });
    });
  }
}
