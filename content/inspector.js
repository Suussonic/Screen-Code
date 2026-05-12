/**
 * inspector.js  (point d'entrée du content script)
 * Orchestre SCHighlight et SCOverlay.
 * Doit être injecté après highlight.js et overlay.js.
 *
 * Guard : empêche la double initialisation si le script est ré-injecté.
 */
if (!window.__screenCodeInjected) {
  window.__screenCodeInjected = true;

  let active        = false;
  let currentTarget = null;

  // Événements souris / clavier

  function onMouseMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || SCHighlight.isOwnElement(el)) return;
    currentTarget = el;
    SCHighlight.moveTo(el);
  }

  function onClick(e) {
    if (!currentTarget) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = {
      left:   Math.round(currentTarget.getBoundingClientRect().left),
      top:    Math.round(currentTarget.getBoundingClientRect().top),
      width:  Math.round(currentTarget.getBoundingClientRect().width),
      height: Math.round(currentTarget.getBoundingClientRect().height),
    };

    SCHighlight.hide();
    deactivate();

    // Demande un screenshot au background service worker
    chrome.runtime.sendMessage({ action: 'captureTab', rect }, (res) => {
      if (res?.dataUrl) SCOverlay.show(res.dataUrl, rect, currentTarget);
    });
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') deactivate();
  }

  // Cycle de vie

  function activate() {
    if (active) return;
    active = true;

    SCHighlight.mount();
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click',     onClick,     true);
    document.addEventListener('keydown',   onKeyDown,   true);
    document.body.style.cursor = 'crosshair';
  }

  function deactivate() {
    active        = false;
    currentTarget = null;

    SCHighlight.hide();
    SCHighlight.remove();
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click',     onClick,     true);
    document.removeEventListener('keydown',   onKeyDown,   true);
    document.body.style.cursor = '';
  }

  // Exposé pour que popup.js puisse ré-activer sans ré-injecter
  window.__screenCodeActivate = activate;

  // Listener messages (depuis popup.js)
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === 'activateInspector') {
      activate();
      sendResponse({ ok: true });
    }
  });

} else {
  // Déjà injecté : on réactive directement
  window.__screenCodeActivate?.();
}
