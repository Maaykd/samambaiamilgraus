const STORAGE_KEY_PRODUCTS = "smg_products";

export function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveProducts(list) {
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(list));
}
