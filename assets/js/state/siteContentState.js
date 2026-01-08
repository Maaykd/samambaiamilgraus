const STORAGE_KEY = "smg_site_content";

const DEFAULT_CONTENT = {
  hero_title: "Prazer, eu sou o Bidô!",
  hero_description: "Texto de apresentação...",
  hero_image_url: "", 
  contact_whatsapp: "",
  contact_instagram: "",
  contact_email: "",
  stats_followers: "118K",
  stats_views: "5.4M",
  stats_posts: "3.5K",
};

export function loadSiteContent() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_CONTENT };
  try {
    return { ...DEFAULT_CONTENT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONTENT };
  }
}

export function saveSiteContent(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
