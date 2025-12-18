// assets/js/utils/sponsors.js

const SPONSORS_KEY = "admin_sponsors";

export function loadSponsors() {
  try {
    const raw = localStorage.getItem(SPONSORS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSponsors(list) {
  localStorage.setItem(SPONSORS_KEY, JSON.stringify(list));
}

export function createSponsor(data) {
  const list = loadSponsors();
  const id = Date.now();
  const sponsor = { id, ...data };
  list.push(sponsor);
  saveSponsors(list);
  return sponsor;
}

export function updateSponsor(id, patch) {
  const list = loadSponsors();
  const idx = list.findIndex(s => s.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch };
    saveSponsors(list);
    return list[idx];
  }
  return null;
}

export function deleteSponsor(id) {
  const list = loadSponsors().filter(s => s.id !== id);
  saveSponsors(list);
}
