// Switch Language (TH / EN)
function switchLanguage(lang) {
  document.body.setAttribute('data-lang', lang);
  document.documentElement.setAttribute('lang', lang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    const isActive = btn.dataset.langBtn === lang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  try {
    localStorage.setItem('vistec_printer_lang', lang);
  } catch (e) {}
}

// Switch OS Segment Tabs
function switchTab(tabId, focusTab) {
  // Update button states (roving tabindex for keyboard access)
  document.querySelectorAll('.segment-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    btn.setAttribute('tabindex', isActive ? '0' : '-1');
    if (isActive && focusTab) btn.focus();
  });

  // Update panel states
  document.querySelectorAll('.tab-pane').forEach(pane => {
    const isActive = pane.id === tabId;
    pane.classList.toggle('active', isActive);
    pane.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  });

  // Save user preference
  try {
    localStorage.setItem('vistec_printer_os_tab', tabId);
  } catch (e) {}
}

// Arrow-key navigation between tabs (WAI-ARIA tabs pattern)
function initTabKeyboard() {
  const tabs = Array.from(document.querySelectorAll('.segment-btn'));
  tabs.forEach((btn, i) => {
    btn.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      switchTab(tabs[next].dataset.tab, true);
    });
  });
}

// Clipboard helper with fallback for non-secure (http) contexts
function writeClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    ok ? resolve() : reject(new Error('execCommand copy failed'));
  });
}

// Copy Code to Clipboard with Accessible Status
function copyText(elementId, btnElement) {
  const codeEl = document.getElementById(elementId);
  if (!codeEl) return;

  const text = codeEl.innerText.trim();
  writeClipboard(text).then(() => {
    // Keep the pristine markup only once, so rapid re-clicks can't lock "Copied"
    if (!btnElement.dataset.originalHtml) {
      btnElement.dataset.originalHtml = btnElement.innerHTML;
    }
    clearTimeout(btnElement._copyTimer);

    const currentLang = document.body.getAttribute('data-lang') || 'en';
    const copiedMsg = currentLang === 'en' ? 'Copied' : 'คัดลอกแล้ว';

    btnElement.classList.add('copied');
    btnElement.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>${copiedMsg}</span>
    `;
    announce(copiedMsg);

    btnElement._copyTimer = setTimeout(() => {
      btnElement.classList.remove('copied');
      btnElement.innerHTML = btnElement.dataset.originalHtml;
      delete btnElement.dataset.originalHtml;
    }, 2000);
  }).catch(err => {
    console.error('Copy failed: ', err);
  });
}

// Screen-reader live announcements
function announce(msg) {
  let live = document.getElementById('srLive');
  if (!live) {
    live = document.createElement('div');
    live.id = 'srLive';
    live.className = 'sr-only';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);
  }
  live.textContent = '';
  setTimeout(() => { live.textContent = msg; }, 30);
}

// Accordion Trigger
function toggleAccordion(btn) {
  const isExpanded = btn.classList.contains('active');
  btn.classList.toggle('active', !isExpanded);
  btn.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');

  const panel = btn.nextElementSibling;
  panel.classList.toggle('active', !isExpanded);
}

// Lightbox Modal
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
let lastFocusedEl = null;

function openModal(img) {
  lastFocusedEl = document.activeElement;
  modalImg.src = img.currentSrc || img.src;
  modalImg.alt = img.alt;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  const closeBtn = modal.querySelector('.image-modal-close');
  if (closeBtn) closeBtn.focus();
}

function closeModal() {
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
  lastFocusedEl = null;
}

document.addEventListener('click', (e) => {
  if (e.target.tagName === 'IMG' && e.target.closest('.doc-figure')) {
    openModal(e.target);
  }
});

// Make figure images keyboard-operable
function initImageA11y() {
  document.querySelectorAll('.doc-figure img').forEach(img => {
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(img);
      }
    });
  });
}

document.addEventListener('keydown', (e) => {
  if (!modal.classList.contains('active')) return;
  if (e.key === 'Escape') {
    closeModal();
  } else if (e.key === 'Tab') {
    // Focus trap: the only focusable control in the lightbox is the close button
    e.preventDefault();
    const closeBtn = modal.querySelector('.image-modal-close');
    if (closeBtn) closeBtn.focus();
  }
});

// Initialization
window.addEventListener('DOMContentLoaded', () => {
  // 1. Language Init
  let savedLang = null;
  try {
    savedLang = localStorage.getItem('vistec_printer_lang');
  } catch (e) {}

  if (savedLang && ['th', 'en'].includes(savedLang)) {
    switchLanguage(savedLang);
  } else {
    // Default to English
    switchLanguage('en');
  }

  // 2. OS Tab Init
  let savedTab = null;
  try {
    savedTab = localStorage.getItem('vistec_printer_os_tab');
  } catch (e) {}

  if (savedTab && ['windows', 'mac', 'card'].includes(savedTab)) {
    switchTab(savedTab);
  } else {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) {
      switchTab('mac');
    } else {
      switchTab('windows');
    }
  }

  // 3. Accessibility
  initTabKeyboard();
  initImageA11y();
});
