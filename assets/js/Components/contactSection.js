// assets/js/components/contactSection.js

export function renderContactSection(rootId = "home-root", content = {}) {
  const root = document.getElementById(rootId);
  if (!root) return;

  const whatsappNumber = (content.whatsapp || "5561981988735").replace(/\D/g, "");
  const whatsappLink = `https://wa.me/${whatsappNumber}`;
  const email = content.email || "samambaiamilgraus@gmail.com";
  const instagram = content.instagram || "samambaiamilgraus";

  const whatsappSvg = `
    <svg viewBox="0 0 32 32" class="contact-card-icon-svg" aria-hidden="true">
      <path fill="#fff" d="M16 3C9.4 3 4 8.4 4 15c0 2.5.8 4.7 2.1 6.6L4 29l7.7-2.1C13.6 27.2 14.8 27 16 27c6.6 0 12-5.4 12-12S22.6 3 16 3zm0 2c5.5 0 10 4.5 10 10s-4.5 10-10 10c-1.2 0-2.4-.3-3.6-.8l-.4-.2-4.5 1.2 1.2-4.4-.2-.4C7 19.2 6.7 18 6.7 17 6.7 9.5 10.5 5 16 5z"/>
      <path fill="#fff" d="M21.1 18.2c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2s-.8 1-.9 1.1-.3.2-.6 0-1.3-.5-2.5-1.6c-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.5.1-.7.1-.1.3-.3.4-.5.2-.2.3-.3.4-.5.1-.2 0-.4 0-.5s-.7-1.7-1-2.3c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.7.3-.2.2-1 1-1 2.4s1 2.8 1.1 3 .2.4.3.6c.4.6 2 3 4.9 4.2.7.3 1.3.5 1.8.6.8.3 1.5.3 2.1.2.7-.1 1.8-.7 2-1.3.2-.6.2-1.1.1-1.3-.1-.1-.2-.2-.5-.4z"/>
    </svg>
  `;

  const instagramSvg = `
    <svg viewBox="0 0 24 24" class="contact-card-icon-svg" aria-hidden="true">
      <path fill="#fff" d="M12 2.2c3.2 0 3.6.01 4.9.07 3.2.15 4.8 1.69 4.9 4.92.06 1.26.07 1.64.07 4.81 0 3.16-.01 3.55-.07 4.81-.15 3.22-1.69 4.77-4.9 4.92-1.27.06-1.67.07-4.9.07-3.23 0-3.63-.01-4.9-.07-3.21-.15-4.75-1.7-4.9-4.92C2.2 15.55 2.2 15.16 2.2 12c0-3.17.01-3.55.07-4.81C2.42 3.96 3.96 2.41 7.18 2.26 8.45 2.2 8.85 2.2 12 2.2zm0-2.2C8.7 0 8.26.01 6.98.07 2.62.27.28 2.61.08 6.98.01 8.27 0 8.71 0 12c0 3.29.01 3.73.08 5.02.2 4.37 2.54 6.71 6.9 6.91 1.28.06 1.72.07 5.02.07s3.74-.01 5.02-.07c4.36-.2 6.7-2.54 6.9-6.91.07-1.29.08-1.73.08-5.02 0-3.29-.01-3.73-.08-5.02C23.72 2.61 21.38.27 17.02.07 15.74.01 15.3 0 12 0z"/>
      <path fill="#fff" d="M12 5.8A6.2 6.2 0 1 0 18.2 12 6.2 6.2 0 0 0 12 5.8zm0 10.2A4 4 0 1 1 16 12a4 4 0 0 1-4 4z"/>
      <circle fill="#fff" cx="18.4" cy="5.6" r="1.2"/>
    </svg>
  `;

  root.insertAdjacentHTML(
    "beforeend",
    `
    <section class="contact-section reveal-section">
      <div class="contact-bg"></div>
      <div class="contact-border-top"></div>

      <div class="contact-inner">
        <div class="contact-header">
          <div class="contact-badge">
            <span>🤝</span>
            <span>Parcerias</span>
          </div>
          <h2 class="contact-title">
            Vamos Trabalhar <span>Juntos?</span>
          </h2>
          <p class="contact-subtext">
            Entre em contato para parcerias, publicidade ou simplesmente pra trocar uma ideia!
          </p>
        </div>

        <div class="contact-grid">
          <!-- WhatsApp -->
          <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" class="contact-card whatsapp">
            <div class="contact-card-icon whatsapp">
              ${whatsappSvg}
            </div>
            <h3 class="contact-card-title">WhatsApp</h3>
            <p class="contact-card-text">(61) 98198-8735</p>
          </a>

          <!-- Instagram -->
          <a href="https://instagram.com/${instagram}" target="_blank" rel="noopener noreferrer" class="contact-card instagram">
            <div class="contact-card-icon instagram">
              ${instagramSvg}
            </div>
            <h3 class="contact-card-title">Instagram</h3>
            <p class="contact-card-text">@${instagram}</p>
          </a>

          <!-- Email -->
          <a href="mailto:${email}" class="contact-card email">
            <div class="contact-card-icon email">
              <span class="contact-card-icon-symbol">✉️</span>
            </div>
            <h3 class="contact-card-title">Email</h3>
            <p class="contact-card-text">${email}</p>
          </a>
        </div>

        <div class="contact-cta">
          <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" class="contact-cta-btn">
            <span>💬</span>
            <span>Entrar em Contato</span>
          </a>
        </div>
      </div>
    </section>
  `
  );
}
