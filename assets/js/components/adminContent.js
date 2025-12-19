// assets/js/components/adminProducts.js
import { db } from "../firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

export function renderAdminProductsManager(container) {
  let products = [];

  container.innerHTML = `
    <section class="admin-products">
      <div class="admin-card" id="admin-products-form"></div>
      <div id="admin-products-list"></div>
    </section>
  `;

  const formBox = container.querySelector("#admin-products-form");
  const listBox = container.querySelector("#admin-products-list");

  renderForm(formBox);
  renderList(listBox, products);
  fetchProducts();

  async function fetchProducts() {
    try {
      const snap = await getDocs(collection(db, "products"));
      products = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      renderList(listBox, products);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      listBox.innerHTML = `
        <div class="admin-card" style="margin-top:1.5rem; text-align:center;">
          <p style="color:#ef4444;">Erro ao carregar produtos.</p>
        </div>
      `;
    }
  }

  function renderForm(box) {
    box.innerHTML = `
      <h2 class="admin-content-title">Adicionar Produto</h2>

      <div class="admin-field-group">
        <label class="admin-label">Nome *</label>
        <input id="product-name" class="admin-input-full" placeholder="Nome do produto" />
      </div>

      <div class="admin-field-group">
        <label class="admin-label">Preço (R$) *</label>
        <input id="product-price" class="admin-input-full" placeholder="99.90" />
      </div>

      <div class="admin-field-group">
        <label class="admin-label">Descrição</label>
        <textarea
          id="product-description"
          class="admin-textarea"
          rows="3"
          placeholder="Descrição do produto..."
        ></textarea>
      </div>

      <div class="admin-field-group">
        <label class="admin-label">URL da Imagem</label>
        <input id="product-image" class="admin-input-full" placeholder="https://..." />
      </div>

      <div class="admin-field-group">
        <label class="admin-label">Categoria</label>
        <select id="product-category" class="admin-input-full">
          <option value="Roupas">Roupas</option>
          <option value="Acessorios">Acessórios</option>
          <option value="Outros">Outros</option>
        </select>
      </div>

      <button id="product-create-btn" class="admin-btn-primary-full">
        ➕ Adicionar Produto
      </button>
      <p id="product-form-status" class="admin-status"></p>
    `;

    const nameEl = box.querySelector("#product-name");
    const priceEl = box.querySelector("#product-price");
    const descEl = box.querySelector("#product-description");
    const imageEl = box.querySelector("#product-image");
    const categoryEl = box.querySelector("#product-category");
    const statusEl = box.querySelector("#product-form-status");

    box.querySelector("#product-create-btn").addEventListener("click", async () => {
      const name = nameEl.value.trim();
      const priceStr = priceEl.value.trim();
      const description = descEl.value.trim();
      const image_url = imageEl.value.trim();
      const category = categoryEl.value;

      if (!name || !priceStr) {
        statusEl.textContent = "Preencha pelo menos nome e preço.";
        return;
      }

      const price = Number(priceStr.replace(",", "."));

      statusEl.textContent = "Salvando...";

      try {
        const docRef = await addDoc(collection(db, "products"), {
          name,
          price,
          description,
          image_url,
          category,
          active: true
        });

        products.push({
          id: docRef.id,
          name,
          price,
          description,
          image_url,
          category,
          active: true
        });

        nameEl.value = "";
        priceEl.value = "";
        descEl.value = "";
        imageEl.value = "";
        categoryEl.value = "Roupas";

        statusEl.textContent = "Produto adicionado!";
        setTimeout(() => (statusEl.textContent = ""), 1500);
        renderList(listBox, products);
      } catch (err) {
        console.error("Erro ao adicionar produto:", err);
        statusEl.textContent = "Erro ao salvar no servidor.";
      }
    });
  }

  function renderList(box, list) {
    if (!list || list.length === 0) {
      box.innerHTML = `
        <div class="admin-card" style="margin-top:1.5rem; text-align:center;">
          <p style="color:#6b7280;">Nenhum produto cadastrado</p>
        </div>
      `;
      return;
    }

    const itemsHtml = list
      .map(
        (p) => `
    <div class="admin-card admin-product-item">
      <div class="admin-product-main">
        <div class="admin-product-avatar">
          ${p.name ? p.name.charAt(0).toUpperCase() : "?"}
        </div>
        <div class="admin-product-info">
          <h3>${p.name}</h3>
          <p class="admin-product-meta">
            R$ ${p.price?.toFixed ? p.price.toFixed(2) : p.price} • ${p.category || ""}
          </p>
        </div>
      </div>

      <div class="admin-product-footer">
        <div class="admin-product-toggle">
          <button
            class="admin-switch ${p.active === false ? "" : "admin-switch--on"}"
            data-action="toggle"
            data-id="${p.id}"
          >
            <span class="admin-switch-thumb"></span>
          </button>
          <span class="admin-product-status-text">
            ${p.active === false ? "Inativo" : "Ativo"}
          </span>
        </div>
        <button
          data-action="delete"
          data-id="${p.id}"
          class="admin-btn-icon admin-btn-danger"
        >
          🗑
        </button>
      </div>
    </div>
  `
      )
      .join("");

    box.innerHTML = `<div class="admin-products-list">${itemsHtml}</div>`;

    box.querySelectorAll("[data-action]").forEach((btn) => {
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");

      btn.addEventListener("click", async () => {
        if (action === "delete") {
          const product = products.find((p) => p.id === id);
          if (!product) return;

          try {
            await deleteDoc(doc(db, "products", product.id));
            products = products.filter((p) => p.id !== id);
            renderList(box, products);
          } catch (err) {
            console.error("Erro ao deletar produto:", err);
          }
        }

        if (action === "toggle") {
          const product = products.find((p) => p.id === id);
          if (!product) return;

          const newActive = !(product.active !== false);

          try {
            await updateDoc(doc(db, "products", product.id), {
              active: newActive
            });

            products = products.map((p) =>
              p.id === id ? { ...p, active: newActive } : p
            );
            renderList(box, products);
          } catch (err) {
            console.error("Erro ao atualizar produto:", err);
          }
        }
      });
    });
  }
}
