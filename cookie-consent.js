(function () {
  const win = window;
  const doc = document;
  const GA_ID = 'G-BB67XV4TK2';
  const STORAGE_KEY = 'mypooch.cookieConsent';
  const CONSENT_ACCEPTED = 'accepted';
  const CONSENT_DECLINED = 'declined';
  const GA_DISABLE_KEY = `ga-disable-${GA_ID}`;
  const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 12 months

  win[GA_DISABLE_KEY] = true;

  let bannerEl = null;
  let stylesInjected = false;
  let analyticsLoaded = false;
  let localStorageUsable = true;

  try {
    const testKey = `${STORAGE_KEY}.test`;
    win.localStorage.setItem(testKey, '1');
    win.localStorage.removeItem(testKey);
  } catch (error) {
    localStorageUsable = false;
  }

  function getStoredPreference() {
    if (localStorageUsable) {
      try {
        return win.localStorage.getItem(STORAGE_KEY);
      } catch (error) {
        // fall back to cookies
      }
    }

    try {
      const match = doc.cookie.match(new RegExp(`(?:^|; )${STORAGE_KEY}=([^;]*)`));
      return match ? decodeURIComponent(match[1]) : null;
    } catch (error) {
      return null;
    }
  }

  function storePreference(value) {
    if (localStorageUsable) {
      try {
        win.localStorage.setItem(STORAGE_KEY, value);
        return;
      } catch (error) {
        // fall back to cookies
      }
    }

    try {
      const secure = win.location.protocol === 'https:' ? ';Secure' : '';
      doc.cookie = `${STORAGE_KEY}=${encodeURIComponent(value)};path=/;max-age=${CONSENT_COOKIE_MAX_AGE};SameSite=Lax${secure}`;
    } catch (error) {
      // swallow write errors
    }
  }

  function injectStyles() {
    if (stylesInjected) {
      return;
    }

    const style = doc.createElement('style');
    style.id = 'cookie-consent-styles';
    style.textContent = `
      .cookie-consent { position: fixed; left: 1rem; right: 1rem; bottom: 1rem; margin: 0 auto; max-width: 560px; background: #ffffff; color: #1f2937; border-radius: 20px; box-shadow: 0 18px 48px rgba(15,23,42,.18); border: 1px solid rgba(81,113,126,.15); padding: 1.5rem; z-index: 2147483640; display: none; }
      .cookie-consent--visible { display: block; animation: cookie-consent-slide .28s ease-out; }
      .cookie-consent__inner { display: grid; gap: 0.75rem; }
      .cookie-consent__heading { margin: 0; font-weight: 700; font-size: 1.05rem; color: #111827; }
      .cookie-consent__text { margin: 0; color: #374151; font-size: .95rem; line-height: 1.5; }
      .cookie-consent__status { margin: 0; color: #4b5563; font-size: .85rem; }
      .cookie-consent__actions { display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; }
      .cookie-consent__button { cursor: pointer; font-weight: 600; font-size: .95rem; border-radius: 12px; border: none; padding: .75rem 1.25rem; }
      .cookie-consent__button--primary { background: #51717e; color: #ffffff; }
      .cookie-consent__button--primary:hover { filter: brightness(1.05); }
      .cookie-consent__button--secondary { background: transparent; border: 1px solid rgba(81,113,126,.4); color: #51717e; }
      .cookie-consent__button--secondary:hover { background: rgba(81,113,126,.08); }
      .cookie-consent__button:focus-visible { outline: 2px solid #97d1a9; outline-offset: 2px; }
      .cookie-consent__link { color: #5fa87a; text-decoration: none; font-weight: 600; }
      .cookie-consent__link:hover, .cookie-consent__link:focus { text-decoration: underline; }
      .cookie-consent__link:focus-visible { outline: 2px solid #97d1a9; outline-offset: 2px; border-radius: 4px; }
      .cookie-consent__actions > * { flex-shrink: 0; }
      @keyframes cookie-consent-slide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      @media (max-width: 600px) { .cookie-consent { padding: 1.25rem; bottom: .75rem; } .cookie-consent__actions { flex-direction: column; align-items: stretch; } .cookie-consent__button { width: 100%; text-align: center; } }
      @media (prefers-reduced-motion: reduce) { .cookie-consent--visible { animation: none; } }
    `;
    doc.head.appendChild(style);
    stylesInjected = true;
  }

  function ensureGtag() {
    win.dataLayer = win.dataLayer || [];
    if (typeof win.gtag !== 'function') {
      win.gtag = function gtag() {
        win.dataLayer.push(arguments);
      };
    }
  }

  function enableAnalytics() {
    win[GA_DISABLE_KEY] = false;
    ensureGtag();

    if (!analyticsLoaded) {
      win.gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted'
      });
    }

    win.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });

    if (!analyticsLoaded) {
      analyticsLoaded = true;
      const script = doc.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      script.async = true;
      script.dataset.cookieConsent = 'ga4';
      doc.head.appendChild(script);
    }

    win.gtag('js', new Date());
    win.gtag('config', GA_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }

  function disableAnalytics() {
    win[GA_DISABLE_KEY] = true;
    if (typeof win.gtag === 'function') {
      win.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }
  }

  function updateStatusText() {
    if (!bannerEl) {
      return;
    }

    const statusEl = bannerEl.querySelector('[data-status]');
    if (!statusEl) {
      return;
    }

    const pref = getStoredPreference();
    if (pref === CONSENT_ACCEPTED) {
      statusEl.textContent = 'Current choice: analytics cookies accepted. Use “Decline” to turn them off.';
    } else if (pref === CONSENT_DECLINED) {
      statusEl.textContent = 'Current choice: analytics cookies declined. You can enable them anytime.';
    } else {
      statusEl.textContent = 'You can change your choice at any time via “Cookie settings”.';
    }
  }

  function createBanner() {
    if (bannerEl) {
      return bannerEl;
    }

    bannerEl = doc.createElement('div');
    bannerEl.className = 'cookie-consent';
    bannerEl.setAttribute('role', 'dialog');
    bannerEl.setAttribute('aria-modal', 'false');
    bannerEl.setAttribute('aria-live', 'polite');
    bannerEl.setAttribute('aria-labelledby', 'cookie-consent-title');
    bannerEl.setAttribute('aria-describedby', 'cookie-consent-description cookie-consent-status');
    bannerEl.innerHTML = `
      <div class="cookie-consent__inner">
        <p class="cookie-consent__heading" id="cookie-consent-title">Cookies & analytics</p>
        <p class="cookie-consent__text" id="cookie-consent-description">We use essential cookies to make our site work. With your permission we’d also like to use Google Analytics 4 to understand traffic and improve mypooch.ie.</p>
        <p class="cookie-consent__status" id="cookie-consent-status" data-status></p>
        <div class="cookie-consent__actions">
          <button type="button" class="cookie-consent__button cookie-consent__button--primary" data-action="accept">Accept analytics</button>
          <button type="button" class="cookie-consent__button cookie-consent__button--secondary" data-action="decline">Decline</button>
          <a class="cookie-consent__link" href="/privacy.html">Learn more</a>
        </div>
      </div>
    `;

    doc.body.appendChild(bannerEl);

    const acceptBtn = bannerEl.querySelector('[data-action="accept"]');
    const declineBtn = bannerEl.querySelector('[data-action="decline"]');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', handleAccept);
    }

    if (declineBtn) {
      declineBtn.addEventListener('click', handleDecline);
    }

    updateStatusText();

    return bannerEl;
  }

  function showBanner(focusAccept = false) {
    const element = createBanner();
    updateStatusText();
    element.classList.add('cookie-consent--visible');

    if (focusAccept) {
      const acceptBtn = element.querySelector('[data-action="accept"]');
      if (acceptBtn) {
        acceptBtn.focus();
      }
    }
  }

  function hideBanner() {
    if (!bannerEl) {
      return;
    }

    bannerEl.classList.remove('cookie-consent--visible');
  }

  function handleAccept() {
    storePreference(CONSENT_ACCEPTED);
    enableAnalytics();
    hideBanner();
  }

  function handleDecline() {
    storePreference(CONSENT_DECLINED);
    disableAnalytics();
    hideBanner();
  }

  function handleManageTrigger(event) {
    const trigger = event.target.closest('[data-cookie-consent="manage"]');
    if (!trigger) {
      return;
    }

    event.preventDefault();
    showBanner(true);
  }

  function init() {
    injectStyles();
    doc.addEventListener('click', handleManageTrigger);

    const pref = getStoredPreference();

    if (pref === CONSENT_ACCEPTED) {
      enableAnalytics();
    } else if (pref === CONSENT_DECLINED) {
      disableAnalytics();
    } else {
      disableAnalytics();
      showBanner(true);
    }
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  win.MyPoochConsent = {
    open: function open() {
      showBanner(true);
    },
    accept: function accept() {
      handleAccept();
    },
    decline: function decline() {
      handleDecline();
    },
    status: function status() {
      return getStoredPreference();
    }
  };
})();
