// assets/js/utils/products.js

const PRODUCTS_KEY = "admin_products";

export function loadProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProducts(list) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
}

export function createProduct(data) {
  const list = loadProducts();
  const id = Date.now();
  const product = { id, ...data };
  list.push(product);
  saveProducts(list);
  return product;
}

export function updateProduct(id, patch) {
  const list = loadProducts();
  const idx = list.findIndex(p => p.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch };
    saveProducts(list);
    return list[idx];
  }
  return null;
}

export function deleteProduct(id) {
  const list = loadProducts().filter(p => p.id !== id);
  saveProducts(list);
}
