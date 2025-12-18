// assets/js/components/userNotRegisteredError.js
export function renderUserNotRegisteredError(rootId = "home-root") {
  const root = document.getElementById(rootId);
  if (!root) return;

  root.innerHTML = `
    <div class="unauth-wrapper">
      <div class="unauth-card">
        <div class="unauth-icon-wrap">
          <svg class="unauth-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 class="unauth-title">Access Restricted</h1>
        <p class="unauth-text">
          You are not registered to use this application. Please contact the app administrator to request access.
        </p>
        <div class="unauth-box">
          <p>If you believe this is an error, you can:</p>
          <ul class="unauth-list">
            <li>Verify you are logged in with the correct account</li>
            <li>Contact the app administrator for access</li>
            <li>Try logging out and back in again</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}
