import { loadProducts, saveProducts } from "../state/productsState.js"; // em adminProducts.js
           // em shop.js


const CATEGORY_LABELS = {
  roupas: "Roupas",
  acessorios: "Acessórios",
  canecas: "Canecas",
  outros: "Outros",
};

export function renderAdminProductsManager(container) {
  let products = loadProducts();

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

  function renderForm(box) {
    box.innerHTML = `
      <h2 class="admin-content-title">Adicionar Produto</h2>
      <div class="admin-field-group">
        <label class="admin-label">Nome *</label>
        <input id="prod-name" class="admin-input-full" placeholder="Nome do produto" />
      </div>
      <div class="admin-field-group">
        <label class="admin-label">Preço (R$) *</label>
        <input id="prod-price" class="admin-input-full" type="number" step="0.01" placeholder="99.90" />
      </div>
      <div class="admin-field-group">
        <label class="admin-label">Descrição</label>
        <textarea id="prod-description" class="admin-textarea" rows="3" placeholder="Descrição do produto..."></textarea>
      </div>
      <div class="admin-field-group">
        <label class="admin-label">URL da Imagem</label>
        <input id="prod-image" class="admin-input-full" placeholder="https://..." />
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
      <button id="prod-create-btn" class="admin-btn-primary-full">
        ➕ Adicionar Produto
      </button>
      <p id="prod-form-status" class="admin-status"></p>
    `;

    const nameEl = box.querySelector("#prod-name");
    const priceEl = box.querySelector("#prod-price");
    const descEl = box.querySelector("#prod-description");
    const imageEl = box.querySelector("#prod-image");
    const catEl = box.querySelector("#prod-category");
    const statusEl = box.querySelector("#prod-form-status");

    box.querySelector("#prod-create-btn").addEventListener("click", () => {
      const name = nameEl.value.trim();
      const price = parseFloat(priceEl.value);
      if (!name || isNaN(price)) {
        statusEl.textContent = "Preencha pelo menos nome e preço.";
        return;
      }

      const prod = {
        id: Date.now(), // id simples; futuramente pode trocar por uuid ou id da API
        name,
        description: descEl.value.trim(),
        price,
        image_url: imageEl.value.trim(),
        category: catEl.value || "outros",
        active: true,
      };

      products.push(prod);
      saveProducts(products);

      nameEl.value = "";
      priceEl.value = "";
      descEl.value = "";
      imageEl.value = "";
      catEl.value = "outros";

      statusEl.textContent = "Produto adicionado!";
      setTimeout(() => (statusEl.textContent = ""), 1500);
      renderList(listBox, products);
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
            ${
              p.image_url
                ? `<img src="${p.image_url}" alt="${p.name}" class="admin-product-thumb">`
                : ""
            }
            <div class="admin-product-info">
              <h3>${p.name}</h3>
              <p class="admin-product-desc">${p.description || ""}</p>
              <div class="admin-product-meta">
                <span class="admin-product-price">R$ ${p.price.toFixed(2)}</span>
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
      .join("");

    box.innerHTML = `
      <div class="admin-products-list">
        ${itemsHtml}
      </div>
    `;

    box.querySelectorAll("[data-action]").forEach((btn) => {
      const id = Number(btn.getAttribute("data-id"));
      const action = btn.getAttribute("data-action");

      btn.addEventListener("click", () => {
        if (action === "delete") {
          products = products.filter((p) => p.id !== id);
          saveProducts(products);
          renderList(box, products);
        }

        if (action === "toggle") {
          products = products.map((p) =>
            p.id === id ? { ...p, active: !(p.active !== false) } : p
          );
          saveProducts(products);
          renderList(box, products);
        }
      });
    });
  }
}
