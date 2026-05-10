/**
 * overlay.js
 * Affiche l'overlay (fond sombri) avec l'aperçu de l'élément capturé
 * et le bouton d'export PNG.
 * Expose : window.SCOverlay
 */
window.SCOverlay = (() => {

  /**
   * Affiche l'overlay avec l'image croppée sur l'élément sélectionné.
   * @param {string} imgDataUrl - Screenshot complet de la page (dataURL)
   * @param {{ left, top, width, height }} rect - Coordonnées de l'élément
   */
  function show(imgDataUrl, rect) {
    const overlay = _buildOverlay();
    const canvas  = _buildCanvas(rect);
    _drawCroppedImage(canvas, imgDataUrl, rect);

    const buttons = _buildButtons(canvas, overlay);
    overlay.append(canvas, buttons);
    document.body.appendChild(overlay);
  }

  // Constructeurs privés

  function _buildOverlay() {
    const el = document.createElement('div');
    el.id = '__sc-overlay';
    el.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      backdrop-filter: blur(4px);
    `;
    el.addEventListener('click', (e) => { if (e.target === el) el.remove(); });
    return el;
  }

  function _buildCanvas(rect) {
    const canvas = document.createElement('canvas');
    canvas.width  = rect.width;
    canvas.height = rect.height;
    canvas.style.cssText = `
      max-width: 90vw;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(100, 200, 255, 0.3);
    `;
    return canvas;
  }

  function _drawCroppedImage(canvas, imgDataUrl, rect) {
    const dpr = window.devicePixelRatio || 1;
    const ctx  = canvas.getContext('2d');
    const img  = new Image();
    img.onload = () => {
      ctx.drawImage(
        img,
        rect.left * dpr, rect.top * dpr,   // source : coin supérieur gauche
        rect.width * dpr, rect.height * dpr, // source : taille
        0, 0,                                // destination
        rect.width, rect.height
      );
    };
    img.src = imgDataUrl;
  }

  function _buildButtons(canvas, overlay) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display: flex; gap: 10px;';
    wrap.append(_buildExportButton(canvas), _buildCloseButton(overlay));
    return wrap;
  }

  function _buildExportButton(canvas) {
    const btn = document.createElement('button');
    btn.textContent = 'Exporter en PNG';
    btn.style.cssText = `
      padding: 10px 24px;
      font: 600 14px 'Segoe UI', sans-serif;
      color: #0f0f13;
      background: linear-gradient(135deg, #64c8ff 0%, #3a8fd4 100%);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(100, 200, 255, 0.3);
    `;
    btn.addEventListener('click', () => {
      const link    = document.createElement('a');
      link.download = `screen-code-${Date.now()}.png`;
      link.href     = canvas.toDataURL('image/png');
      link.click();
    });
    return btn;
  }

  function _buildCloseButton(overlay) {
    const btn = document.createElement('button');
    btn.textContent = '✕ Fermer';
    btn.style.cssText = `
      padding: 8px 20px;
      font: 600 13px 'Segoe UI', sans-serif;
      color: #aaa;
      background: transparent;
      border: 1px solid #555;
      border-radius: 8px;
      cursor: pointer;
    `;
    btn.addEventListener('click', () => overlay.remove());
    return btn;
  }

  return { show };
})();
