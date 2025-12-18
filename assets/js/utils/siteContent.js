const STORAGE_KEY = "admin_siteContent";

export function loadSiteContent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getHeroContent() {
  return loadSiteContent().find(c => c.section === "hero") || {};
}

export function getContactContent() {
  return loadSiteContent().find(c => c.section === "contact") || {};
}
