// assets/js/pages/home.js
import { renderNavbar } from "../Components/navbar.js";
import { renderHeroSection } from "../Components/heroSection.js";
import { renderSponsorsCarousel } from "../Components/sponsorsCarousel.js";
import { loadActiveSponsors } from "../utils/sponsorsPublic.js";
import { renderContentSection } from "../Components/contentSection.js";
import { renderContactSection } from "../Components/contactSection.js";
import { renderFooter } from "../Components/footer.js";
import { initScrollReveal } from "../utils/revealOnScroll.js";
import { loadSiteContent } from "../state/siteContentState.js";

document.addEventListener("DOMContentLoaded", () => {
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
    email: heroContent.email,
  };

  renderHeroSection("home-root", heroContent);
  renderSponsorsCarousel("home-root", loadActiveSponsors());
  renderContentSection("home-root");
  renderContactSection("home-root", contactContent);
  renderFooter("home-root");

  initScrollReveal();
});
