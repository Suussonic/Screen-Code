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
    const formats = [
      { label: 'PNG',  value: 'png',  mime: 'image/png' },
      { label: 'JPEG', value: 'jpeg', mime: 'image/jpeg' },
      { label: 'WebP', value: 'webp', mime: 'image/webp' },
    ];
    let currentFormat = formats[0];

    // ── Wrapper split button ──
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      border-radius: 8px;
      overflow: visible;
      box-shadow: 0 4px 16px rgba(100, 200, 255, 0.3);
      position: relative;
    `;

    // ── Bouton principal ──
    const btn = document.createElement('button');
    btn.textContent = 'Exporter en PNG';
    btn.style.cssText = `
      padding: 10px 20px;
      font: 600 14px 'Segoe UI', sans-serif;
      color: #0f0f13;
      background: linear-gradient(135deg, #64c8ff 0%, #3a8fd4 100%);
      border: none;
      border-radius: 8px 0 0 8px;
      cursor: pointer;
      border-right: 1px solid rgba(0, 0, 0, 0.2);
    `;
    btn.addEventListener('click', () => {
      const link    = document.createElement('a');
      link.download = `screen-code-${Date.now()}.${currentFormat.value}`;
      link.href     = canvas.toDataURL(currentFormat.mime);
      link.click();
    });

    // ── Bouton chevron ──
    const toggle = document.createElement('button');
    toggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="7" viewBox="0 0 11 7" fill="none"><path d="M1 1l4.5 4.5L10 1" stroke="#0f0f13" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    toggle.style.cssText = `
      padding: 10px 10px;
      color: #0f0f13;
      background: linear-gradient(135deg, #64c8ff 0%, #3a8fd4 100%);
      border: none;
      border-radius: 0 8px 8px 0;
      cursor: pointer;
      display: flex;
      align-items: center;
    `;

    // ── Menu dropdown ──
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: absolute;
      bottom: calc(100% + 8px);
      right: 0;
      background: #1a1a2e;
      border: 1px solid #2e4a6a;
      border-radius: 8px;
      overflow: hidden;
      display: none;
      flex-direction: column;
      min-width: 110px;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.6);
      z-index: 2147483648;
    `;

    formats.forEach(fmt => {
      const item = document.createElement('button');
      item.textContent = fmt.label;
      item.style.cssText = `
        padding: 9px 16px;
        font: 500 13px 'Segoe UI', sans-serif;
        color: ${fmt === currentFormat ? '#64c8ff' : '#e2e8f0'};
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
        width: 100%;
        transition: background 0.1s;
      `;
      item.addEventListener('mouseover', () => { item.style.background = '#2a2a3a'; });
      item.addEventListener('mouseout',  () => { item.style.background = 'transparent'; });
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        currentFormat = fmt;
        btn.textContent = `Exporter en ${fmt.label}`;
        menu.style.display = 'none';
        menu.querySelectorAll('button').forEach(b => { b.style.color = '#e2e8f0'; });
        item.style.color = '#64c8ff';
      });
      menu.appendChild(item);
    });

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.style.display === 'flex';
      menu.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) menu.style.flexDirection = 'column';
    });

    document.addEventListener('click', () => { menu.style.display = 'none'; });

    wrapper.appendChild(btn);
    wrapper.appendChild(toggle);
    wrapper.appendChild(menu);
    return wrapper;
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
