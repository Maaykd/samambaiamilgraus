// assets/js/pages/home.js
import { renderNavbar } from "../components/navbar.js";
import { renderHeroSection } from "../components/heroSection.js";
import { renderSponsorsCarousel } from "../components/sponsorsCarousel.js";
import { renderContentSection } from "../components/contentSection.js";
import { renderContactSection } from "../components/contactSection.js";
import { renderFooter } from "../components/footer.js";
import { initScrollReveal } from "../utils/revealOnScroll.js";
import { loadSiteContent } from "../state/siteContentState.js";

import { db } from "../firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

async function loadActiveSponsorsFromFirestore() {
  const snap = await getDocs(collection(db, "sponsors"));
  const sponsors = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  // se o seu renderSponsorsCarousel espera só ativos, filtramos aqui
  return sponsors.filter(s => s.active !== false);
}

document.addEventListener("DOMContentLoaded", async () => {
  renderNavbar("navbar-root");

  const siteContent = loadSiteContent();

  const heroContent = {
    title:
      siteContent.hero_title ||
      "Prazer, eu sou o Bidô!",
    description:
      siteContent.hero_description ||
      "Vulgo Mil Graus!! Cria de Samambaia, 33 anos, cursando publicidade e propaganda. A página foi fundada em 2021 com o intuito de trazer notícias e entretenimento com muito humor.",
    whatsapp: siteContent.contact_whatsapp || "5561981988735",
    instagram: siteContent.contact_instagram || "samambaiamilgraus",
    email: siteContent.contact_email || "samambaiamilgraus@gmail.com",
    image_url:
      siteContent.hero_image_url || "assets/img/hero-default.jpg"
  };

  const contactContent = {
    whatsapp: heroContent.whatsapp,
    instagram: heroContent.instagram,
    email: heroContent.email
  };

  renderHeroSection("home-root", heroContent);

  // carrossel de patrocinadores vindo do Firestore
  try {
    const sponsors = await loadActiveSponsorsFromFirestore();
    renderSponsorsCarousel("home-root", sponsors);
  } catch (err) {
    console.error("Erro ao carregar patrocinadores na Home:", err);
    // se quiser, pode renderizar um fallback aqui
  }

  renderContentSection("home-root");
  renderContactSection("home-root", contactContent);
  renderFooter("home-root");

  initScrollReveal();
});
