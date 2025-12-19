// assets/js/components/adminContent.js
import { loadSiteContentRemote, saveSiteContentRemote } from "../state/siteContentRemote.js";

export function renderAdminContentManager(container) {
  container.innerHTML = `
    <div class="admin-content-grid">
      <!-- Hero -->
      <section class="admin-card">
        <h2 class="admin-content-title">Seção Principal (Hero)</h2>

        <div class="admin-field-group">
          <label class="admin-label" for="hero-title">Título</label>
          <input
            id="hero-title"
            class="admin-input-full"
            type="text"
            placeholder="Prazer, eu sou o Bidô!"
            value=""
          />
        </div>

        <div class="admin-field-group">
          <label class="admin-label" for="hero-description">Descrição</label>
          <textarea
            id="hero-description"
            class="admin-textarea"
            rows="4"
            placeholder="Texto de apresentação..."
          ></textarea>
        </div>

        <div class="admin-field-group">
          <label class="admin-label" for="hero-image-url">
            URL da Foto (ideal 900x1100px)
          </label>
          <input
            id="hero-image-url"
            class="admin-input-full"
            type="text"
            placeholder="https://... ou caminho local"
            value=""
          />
          <p class="admin-status" style="color:#9ca3af;margin-top:0.25rem;">
            Tamanho ideal: 900x1100px, formato JPG.
          </p>
        </div>

        <button id="btn-save-hero" class="admin-btn-primary-full">
          <span>💾</span>
          <span>Salvar Hero</span>
        </button>
        <p id="hero-status" class="admin-status"></p>
      </section>

      <!-- Contato -->
      <section class="admin-card">
        <h2 class="admin-content-title">Informações de Contato</h2>

        <div class="admin-field-group">
          <label class="admin-label" for="contact-whatsapp">WhatsApp</label>
          <input
            id="contact-whatsapp"
            class="admin-input-full"
            type="text"
            placeholder="5561981988735"
            value=""
          />
        </div>

        <div class="admin-field-group">
          <label class="admin-label" for="contact-instagram">Instagram (@)</label>
          <input
            id="contact-instagram"
            class="admin-input-full"
            type="text"
            placeholder="samambaiamilgraus"
            value=""
          />
        </div>

        <div class="admin-field-group">
          <label class="admin-label" for="contact-email">Email</label>
          <input
            id="contact-email"
            class="admin-input-full"
            type="email"
            placeholder="samambaiamilgraus@gmail.com"
            value=""
          />
        </div>

        <button id="btn-save-contact" class="admin-btn-primary-full">
          <span>💾</span>
          <span>Salvar Contato</span>
        </button>
        <p id="contact-status" class="admin-status"></p>
      </section>
    </div>
  `;

  const heroTitle = container.querySelector("#hero-title");
  const heroDesc = container.querySelector("#hero-description");
  const heroImageEl = container.querySelector("#hero-image-url");
  const heroStatus = container.querySelector("#hero-status");

  const contactWhats = container.querySelector("#contact-whatsapp");
  const contactInsta = container.querySelector("#contact-instagram");
  const contactEmail = container.querySelector("#contact-email");
  const contactStatus = container.querySelector("#contact-status");

  // carregar dados do Firestore e preencher os campos
  (async () => {
    try {
      const remote = await loadSiteContentRemote();
      heroTitle.value = remote.hero_title || "";
      heroDesc.value = remote.hero_description || "";
      heroImageEl.value = remote.hero_image_url || "";
      contactWhats.value = remote.contact_whatsapp || "";
      contactInsta.value = remote.contact_instagram || "";
      contactEmail.value = remote.contact_email || "";
    } catch (err) {
      console.error("Erro ao carregar siteContent no ADM:", err);
    }
  })();

  container.querySelector("#btn-save-hero").addEventListener("click", async () => {
    heroStatus.textContent = "Salvando...";
    try {
      await saveSiteContentRemote({
        hero_title: heroTitle.value.trim(),
        hero_description: heroDesc.value.trim(),
        hero_image_url: heroImageEl.value.trim()
      });
      heroStatus.textContent = "Hero salvo com sucesso!";
    } catch (err) {
      console.error("Erro ao salvar Hero:", err);
      heroStatus.textContent = "Erro ao salvar.";
    }
    setTimeout(() => (heroStatus.textContent = ""), 2000);
  });

  container.querySelector("#btn-save-contact").addEventListener("click", async () => {
    contactStatus.textContent = "Salvando...";
    try {
      await saveSiteContentRemote({
        contact_whatsapp: contactWhats.value.trim(),
        contact_instagram: contactInsta.value.trim(),
        contact_email: contactEmail.value.trim()
      });
      contactStatus.textContent = "Contato salvo com sucesso!";
    } catch (err) {
      console.error("Erro ao salvar contato:", err);
      contactStatus.textContent = "Erro ao salvar.";
    }
    setTimeout(() => (contactStatus.textContent = ""), 2000);
  });
}
