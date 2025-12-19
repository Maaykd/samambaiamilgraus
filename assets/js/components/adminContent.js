// assets/js/components/adminContent.js
import { loadSiteContentRemote, saveSiteContentRemote } from "../state/siteContentRemote.js";
import { storage } from "../firebase.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";

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
          <label class="admin-label" for="hero-image-file">
            Foto do Hero (upload)
          </label>
          <input
            id="hero-image-file"
            type="file"
            accept="image/*"
            class="admin-input-full"
          />
          <small class="admin-help-text">
            Tamanho ideal: 900x1100px, formato JPG.
          </small>
        </div>

        <div class="admin-field-group">
          <label class="admin-label" for="hero-image-url">
            URL da Foto (opcional)
          </label>
          <input
            id="hero-image-url"
            class="admin-input-full"
            type="text"
            placeholder="https://... (usar se não enviar arquivo)"
            value=""
          />
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
  const heroImageUrlEl = container.querySelector("#hero-image-url");
  const heroImageFileEl = container.querySelector("#hero-image-file");
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
      heroImageUrlEl.value = remote.hero_image_url || "";
      contactWhats.value = remote.contact_whatsapp || "";
      contactInsta.value = remote.contact_instagram || "";
      contactEmail.value = remote.contact_email || "";
    } catch (err) {
      console.error("Erro ao carregar siteContent no ADM:", err);
    }
  })();

  container.querySelector("#btn-save-hero").addEventListener("click", async () => {
    heroStatus.textContent = "Salvando...";

    const title = heroTitle.value.trim();
    const description = heroDesc.value.trim();
    const manualUrl = heroImageUrlEl.value.trim();
    const file = heroImageFileEl.files[0] || null;

    try {
      let finalImageUrl = manualUrl;

      // Se tiver arquivo, faz upload para o Storage
      if (file) {
        const safeName = title
          ? title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "")
          : "hero";
        const fileExt = file.name.split(".").pop() || "jpg";
        const filePath = `hero/${Date.now()}-${safeName}.${fileExt}`;

        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, file);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      await saveSiteContentRemote({
        hero_title: title,
        hero_description: description,
        hero_image_url: finalImageUrl,
      });

      if (finalImageUrl) {
        heroImageUrlEl.value = finalImageUrl;
      }
      heroImageFileEl.value = "";

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
        contact_email: contactEmail.value.trim(),
      });
      contactStatus.textContent = "Contato salvo com sucesso!";
    } catch (err) {
      console.error("Erro ao salvar contato:", err);
      contactStatus.textContent = "Erro ao salvar.";
    }
    setTimeout(() => (contactStatus.textContent = ""), 2000);
  });
}
