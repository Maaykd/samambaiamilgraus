// assets/js/components/footer.js

function createPageUrl(name) {
  if (name === "Home") return "index.html";
  return name.toLowerCase() + ".html";
}

export function renderFooter(rootId = "home-root") {
  const root = document.getElementById(rootId);
  if (!root) return;

  const year = new Date().getFullYear();

  root.insertAdjacentHTML(
    "beforeend",
    `
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <span class="footer-brand-emoji">😎</span>
            <div>
              <p class="footer-brand-title">SAMAMBAIA MIL GRAUS</p>
              <p class="footer-brand-sub">@samambaiamilgraus</p>
            </div>
          </div>

          <div class="footer-social">
            <a href="https://instagram.com/samambaiamilgraus" target="_blank" rel="noopener noreferrer" class="footer-social-link">
              <span>📷</span>
            </a>
          </div>

          <a href="${createPageUrl("Admin")}" class="footer-admin-link">
            <span>🔒</span>
            <span>Área restrita</span>
          </a>
        </div>

        <div class="footer-bottom">
          © ${year} Samambaia Mil Graus. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  `
  );
}
