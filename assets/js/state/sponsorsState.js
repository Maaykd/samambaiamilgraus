// assets/js/state/sponsorsState.js
const STORAGE_KEY_SPONSORS = "smg_sponsors";

export function loadSponsors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SPONSORS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSponsors(list) {
  localStorage.setItem(STORAGE_KEY_SPONSORS, JSON.stringify(list));
}
