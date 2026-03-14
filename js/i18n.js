// ─── I18N — Internationalization ────────────────────────────────────────────────
// Supported language codes
const SUPPORTED = ['en', 'vi'];
const DEFAULT_LANG = 'en';

let _locale = {};
let _lang = DEFAULT_LANG;

/**
 * Initialise i18n: detect language (localStorage → navigator.language → default),
 * then fetch the matching locale JSON.
 */
export async function initI18n() {
  const stored = localStorage.getItem('lang');
  if (stored && SUPPORTED.includes(stored)) {
    _lang = stored;
  } else {
    const detected = (navigator.language || '').slice(0, 2).toLowerCase();
    _lang = SUPPORTED.includes(detected) ? detected : DEFAULT_LANG;
  }
  await _loadLocale(_lang);
  // Sync html[lang] attribute
  document.documentElement.lang = _lang;
}

async function _loadLocale(lang) {
  try {
    const res = await fetch(`locales/${lang}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    _locale = await res.json();
  } catch {
    // Fallback to English if the requested locale fails to load
    if (lang !== DEFAULT_LANG) {
      try {
        const res = await fetch(`locales/${DEFAULT_LANG}.json`);
        _locale = await res.json();
      } catch { _locale = {}; }
    } else {
      _locale = {};
    }
  }
}

/**
 * Translate a key, with optional variable interpolation.
 * e.g. t('announce.level_up', { n: 5 }) → '⬆️ LEVEL UP! 5'
 * Falls back to the key itself if not found.
 */
export function t(key, vars = {}) {
  let str = Object.prototype.hasOwnProperty.call(_locale, key) ? _locale[key] : key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.split(`{${k}}`).join(String(v));
  }
  return str;
}

/** Return the active language code, e.g. 'en' or 'vi'. */
export function getLang() { return _lang; }

/** Persist a language choice to localStorage (takes effect on next reload). */
export function setLang(lang) {
  if (SUPPORTED.includes(lang)) {
    localStorage.setItem('lang', lang);
  }
}

/** All supported language codes. */
export function getSupportedLangs() { return [...SUPPORTED]; }

/**
 * Walk the DOM and apply translations to:
 *   [data-i18n]             → element.textContent
 *   [data-i18n-placeholder] → element.placeholder
 *   [data-i18n-title]       → element.title
 */
export function applyDOM(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
}
