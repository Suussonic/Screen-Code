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
  function show(imgDataUrl, rect, element) {
    const overlay = _buildOverlay();
    const canvas  = _buildCanvas(rect);
    _drawCroppedImage(canvas, imgDataUrl, rect);

    let currentRadius = 0;
    const getRadius = () => currentRadius;

    const scrollX = Math.round(window.scrollX);
    const scrollY = Math.round(window.scrollY);
    const fullRect = Object.assign({}, rect, { scrollX, scrollY });

    const slider  = _buildRadiusSlider(canvas, (r) => { currentRadius = r; });
    const buttons = _buildButtons(canvas, overlay, getRadius);

    const viewH = window.innerHeight;

    // Compute already-visible height, accounting for scrollable containers
    const scrollContainer = element ? _findScrollableContainer(element) : null;
    let visibleH;
    if (scrollContainer) {
      const scr = scrollContainer.getBoundingClientRect();
      visibleH = Math.min(scr.top + scrollContainer.clientHeight - rect.top, rect.height);
    } else {
      visibleH = Math.min(viewH - rect.top, rect.height);
    }
    visibleH = Math.max(0, Math.round(visibleH));

    const isClipped = rect.top >= 0 && visibleH < rect.height;

    overlay.append(slider);
    if (isClipped) {
      overlay.append(_buildClipWarning(canvas, fullRect, overlay, visibleH, element));
    }
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

  function _buildButtons(canvas, overlay, getRadius) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display: flex; gap: 10px;';
    wrap.append(_buildExportButton(canvas, getRadius), _buildCloseButton(overlay));
    return wrap;
  }

  function _buildRadiusSlider(canvas, setRadius) {
    const maxRadius = Math.min(canvas.width, canvas.height) / 2;

    // Inject custom slider styles once
    if (!document.getElementById('__sc-slider-styles')) {
      const style = document.createElement('style');
      style.id = '__sc-slider-styles';
      style.textContent = `
        #__sc-radius-input {
          -webkit-appearance: none;
          appearance: none;
          flex: 1;
          height: 5px;
          border-radius: 3px;
          outline: none;
          cursor: pointer;
          background: linear-gradient(
            to right,
            #64c8ff 0%,
            #64c8ff var(--sc-val, 0%),
            rgba(100, 200, 255, 0.15) var(--sc-val, 0%),
            rgba(100, 200, 255, 0.15) 100%
          );
        }
        #__sc-radius-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #64c8ff;
          box-shadow: 0 0 0 3px rgba(100, 200, 255, 0.2), 0 2px 8px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        #__sc-radius-input::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 0 0 5px rgba(100, 200, 255, 0.25), 0 4px 14px rgba(100, 200, 255, 0.5);
        }
        #__sc-radius-input::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #64c8ff;
          box-shadow: 0 0 0 3px rgba(100, 200, 255, 0.2);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        #__sc-radius-input::-moz-range-track {
          height: 5px;
          border-radius: 3px;
          background: rgba(100, 200, 255, 0.15);
        }
      `;
      document.head.appendChild(style);
    }

    const wrap = document.createElement('div');
    wrap.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: rgba(10, 14, 30, 0.92);
      border: 1px solid rgba(100, 200, 255, 0.18);
      border-radius: 12px;
      width: min(90vw, ${canvas.width}px);
      box-sizing: border-box;
      backdrop-filter: blur(10px);
    `;

    const icon = document.createElement('span');
    icon.innerHTML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 13V8C2 4.686 4.686 2 8 2h5" stroke="#64c8ff" stroke-width="2" stroke-linecap="round"/></svg>`;
    icon.style.cssText = `flex-shrink: 0; display: flex; align-items: center; opacity: 0.85;`;

    const label = document.createElement('span');
    label.textContent = 'Arrondi';
    label.style.cssText = `
      font: 500 12px 'Segoe UI', sans-serif;
      color: #8892a4;
      white-space: nowrap;
      flex-shrink: 0;
    `;

    const input = document.createElement('input');
    input.type  = 'range';
    input.min   = '0';
    input.max   = '100';
    input.value = '0';
    input.id    = '__sc-radius-input';
    input.style.cssText = 'flex: 1;';
    input.style.setProperty('--sc-val', '0%');

    const valuePill = document.createElement('span');
    valuePill.textContent = '0px';
    valuePill.style.cssText = `
      font: 600 11px 'Consolas', monospace;
      color: #0a0e1e;
      background: linear-gradient(135deg, #64c8ff, #3a8fd4);
      padding: 3px 8px;
      border-radius: 20px;
      min-width: 42px;
      text-align: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(100, 200, 255, 0.35);
      transition: transform 0.1s ease;
    `;

    input.addEventListener('input', () => {
      const pct = `${input.value}%`;
      input.style.setProperty('--sc-val', pct);
      const r = Math.round((input.value / 100) * maxRadius);
      setRadius(r);
      canvas.style.borderRadius = r + 'px';
      valuePill.textContent = r + 'px';
      valuePill.style.transform = 'scale(1.1)';
      clearTimeout(valuePill.__st);
      valuePill.__st = setTimeout(() => { valuePill.style.transform = 'scale(1)'; }, 120);
    });

    wrap.append(icon, label, input, valuePill);
    return wrap;
  }

  function _buildExportButton(canvas, getRadius) {
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
      const radius  = getRadius();
      const out     = document.createElement('canvas');
      out.width     = canvas.width;
      out.height    = canvas.height;
      const ctx     = out.getContext('2d');
      if (radius > 0) {
        ctx.beginPath();
        _roundRectPath(ctx, 0, 0, out.width, out.height, radius);
        ctx.clip();
      }
      ctx.drawImage(canvas, 0, 0);
      const link    = document.createElement('a');
      link.download = `screen-code-${Date.now()}.${currentFormat.value}`;
      link.href     = out.toDataURL(currentFormat.mime);
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

  function _roundRectPath(ctx, x, y, w, h, r) {
    const maxR = Math.min(w, h) / 2;
    r = Math.min(r, maxR);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,     y + h, x,         y + h - r, r);
    ctx.lineTo(x,     y + r);
    ctx.arcTo(x,     y,     x + r,     y,         r);
    ctx.closePath();
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

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _findScrollableContainer(el) {
    let p = el.parentElement;
    while (p && p !== document.documentElement) {
      const style = window.getComputedStyle(p);
      const oy = style.overflowY;
      if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 1) {
        return p;
      }
      p = p.parentElement;
    }
    return null; // use window
  }

  function _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = reject;
      img.src     = src;
    });
  }

  // ── Clip warning ──────────────────────────────────────────────────────────

  function _buildClipWarning(canvas, rect, overlay, visibleH, element) {
    const missingH = rect.height - visibleH;

    const wrap = document.createElement('div');
    wrap.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 14px;
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.28);
      border-radius: 10px;
      width: min(90vw, ${canvas.width}px);
      box-sizing: border-box;
    `;

    const icon = document.createElement('span');
    icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="display:block"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#f5a623" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="#f5a623" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="#f5a623"/></svg>`;
    icon.style.cssText = 'flex-shrink: 0; display: flex; align-items: center;';

    const text = document.createElement('span');
    text.style.cssText = "font: 500 12px 'Segoe UI', sans-serif; color: #c8a050; flex: 1; line-height: 1.4;";
    text.innerHTML = `Élément partiellement chargé &mdash; <b style="color:#f5a623">${visibleH}px</b> visibles sur <b style="color:#e2e8f0">${rect.height}px</b>`;

    // ── Dropdown ──
    const dropWrap = document.createElement('div');
    dropWrap.style.cssText = 'position: relative; flex-shrink: 0;';

    const dropBtn = document.createElement('button');
    dropBtn.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 11px;
      font: 600 12px 'Segoe UI', sans-serif;
      color: #f5a623;
      background: rgba(245, 166, 35, 0.12);
      border: 1px solid rgba(245, 166, 35, 0.35);
      border-radius: 7px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    `;
    dropBtn.innerHTML = `Options <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#f5a623" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    dropBtn.addEventListener('mouseover', () => { dropBtn.style.background = 'rgba(245,166,35,0.2)'; });
    dropBtn.addEventListener('mouseout',  () => { dropBtn.style.background = 'rgba(245,166,35,0.12)'; });

    const menu = document.createElement('div');
    menu.style.cssText = `
      position: absolute;
      top: calc(100% + 7px);
      right: 0;
      background: #0d1020;
      border: 1px solid rgba(245, 158, 11, 0.22);
      border-radius: 10px;
      overflow: hidden;
      display: none;
      flex-direction: column;
      min-width: 210px;
      box-shadow: 0 10px 32px rgba(0, 0, 0, 0.75);
      z-index: 2147483648;
    `;

    function _menuItem(svgIcon, title, desc, onClick) {
      const item = document.createElement('button');
      item.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 14px;
        font-family: 'Segoe UI', sans-serif;
        color: #e2e8f0;
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
        width: 100%;
        transition: background 0.1s;
      `;
      item.addEventListener('mouseover', () => { item.style.background = 'rgba(255,255,255,0.05)'; });
      item.addEventListener('mouseout',  () => { item.style.background = 'transparent'; });

      const iconEl = document.createElement('span');
      iconEl.innerHTML = svgIcon;
      iconEl.style.cssText = 'flex-shrink: 0; display: flex; align-items: center; margin-top: 2px;';

      const textWrap = document.createElement('div');
      const titleEl  = document.createElement('div');
      titleEl.textContent = title;
      titleEl.style.cssText = 'font-size: 13px; font-weight: 600; color: #f0f4ff;';
      const descEl = document.createElement('div');
      descEl.textContent = desc;
      descEl.style.cssText = 'font-size: 11px; color: #8892a4; margin-top: 2px;';
      textWrap.append(titleEl, descEl);

      item.append(iconEl, textWrap);
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = 'none';
        onClick();
      });
      return item;
    }

    const scissorsSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="6" r="3" stroke="#aaa" stroke-width="2"/><circle cx="6" cy="18" r="3" stroke="#aaa" stroke-width="2"/><line x1="20" y1="4" x2="8.12" y2="15.88" stroke="#aaa" stroke-width="2" stroke-linecap="round"/><line x1="14.47" y1="14.48" x2="20" y2="20" stroke="#aaa" stroke-width="2" stroke-linecap="round"/></svg>`;
    const arrowDownSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7 7 7-7" stroke="#64c8ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    // Option 1 — Couper ici
    menu.appendChild(_menuItem(scissorsSvg, 'Couper ici', `Garder les ${visibleH}px déjà chargés`, () => {
      _cropCanvas(canvas, visibleH);
      wrap.remove();
    }));

    const sep = document.createElement('div');
    sep.style.cssText = 'height: 1px; background: rgba(255,255,255,0.07); margin: 2px 0;';
    menu.appendChild(sep);

    // Option 2 — Charger le reste
    menu.appendChild(_menuItem(arrowDownSvg, 'Charger le reste', `Capturer les ${missingH}px manquants`, async () => {
      wrap.remove();
      await _scrollCaptureRest(canvas, rect, overlay, visibleH, element);
    }));

    dropBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.style.display === 'flex';
      menu.style.display = open ? 'none' : 'flex';
      if (!open) menu.style.flexDirection = 'column';
    });
    document.addEventListener('click', () => { menu.style.display = 'none'; });

    dropWrap.append(dropBtn, menu);
    wrap.append(icon, text, dropWrap);
    return wrap;
  }

  // ── Crop canvas to a given height ─────────────────────────────────────────

  function _cropCanvas(canvas, height) {
    const tmp = document.createElement('canvas');
    tmp.width  = canvas.width;
    tmp.height = height;
    tmp.getContext('2d').drawImage(canvas, 0, 0);
    canvas.height = height;
    canvas.getContext('2d').drawImage(tmp, 0, 0);
  }

  // ── Scroll-capture the portion below the visible area ─────────────────────

  async function _scrollCaptureRest(canvas, rect, overlay, firstChunkH, element) {
    const dpr    = window.devicePixelRatio || 1;
    const totalH = rect.height;
    const totalW = rect.width;
    const ctx    = canvas.getContext('2d');

    // Determine whether to scroll the window or a scrollable container
    const scrollContainer = element ? _findScrollableContainer(element) : null;
    let captureViewportTop, captureViewportH, scrollFn, restoreFn;

    if (scrollContainer) {
      const scr         = scrollContainer.getBoundingClientRect();
      const origScrollT = scrollContainer.scrollTop;
      // Offset of element's top within the container's scroll content
      const elemOffset  = (rect.top - scr.top) + origScrollT;
      captureViewportTop = Math.max(0, Math.round(scr.top));
      captureViewportH   = scrollContainer.clientHeight;

      scrollFn = async (capturedSoFar) => {
        scrollContainer.scrollTop = elemOffset + capturedSoFar;
        await new Promise(r => setTimeout(r, 260));
      };
      restoreFn = async () => {
        scrollContainer.scrollTop = origScrollT;
        await new Promise(r => setTimeout(r, 180));
      };
    } else {
      const origScrollX = rect.scrollX || 0;
      const origScrollY = rect.scrollY || 0;
      const absTop      = rect.top + origScrollY;
      captureViewportTop = 0;
      captureViewportH   = window.innerHeight;

      scrollFn = async (capturedSoFar) => {
        window.scrollTo(origScrollX, absTop + capturedSoFar);
        await new Promise(r => setTimeout(r, 260));
      };
      restoreFn = async () => {
        window.scrollTo(origScrollX, origScrollY);
        await new Promise(r => setTimeout(r, 180));
      };
    }

    let capturedSoFar = firstChunkH;

    // Progress toast
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      background: rgba(10, 14, 30, 0.96);
      border: 1px solid rgba(100, 200, 255, 0.25);
      border-radius: 10px;
      padding: 11px 16px;
      font: 500 13px 'Segoe UI', sans-serif;
      color: #e2e8f0;
      box-shadow: 0 8px 24px rgba(0,0,0,0.7);
      display: flex;
      flex-direction: column;
      gap: 7px;
      min-width: 210px;
    `;
    const toastLabel = document.createElement('span');
    const toastTrack = document.createElement('div');
    toastTrack.style.cssText = 'height: 3px; border-radius: 2px; background: rgba(100,200,255,0.15); overflow: hidden;';
    const toastFill = document.createElement('div');
    toastFill.style.cssText = 'height: 100%; border-radius: 2px; background: linear-gradient(90deg,#64c8ff,#3a8fd4); transition: width 0.2s ease;';
    toastTrack.appendChild(toastFill);
    toast.append(toastLabel, toastTrack);

    const _updateToast = (n) => {
      toastLabel.textContent = `Capture en cours... ${n}px / ${totalH}px`;
      toastFill.style.width  = `${Math.round((n / totalH) * 100)}%`;
    };
    _updateToast(firstChunkH);
    document.body.appendChild(toast);

    overlay.style.display = 'none';

    try {
      while (capturedSoFar < totalH) {
        await scrollFn(capturedSoFar);

        const res = await new Promise(resolve =>
          chrome.runtime.sendMessage({ action: 'captureTab' }, resolve)
        );
        if (!res?.dataUrl) break;

        const img    = await _loadImage(res.dataUrl);
        const chunkH = Math.min(captureViewportH, totalH - capturedSoFar);

        ctx.drawImage(
          img,
          Math.round(rect.left           * dpr), Math.round(captureViewportTop * dpr),
          Math.round(totalW              * dpr), Math.round(chunkH             * dpr),
          0, capturedSoFar, totalW, chunkH
        );
        capturedSoFar += chunkH;
        _updateToast(capturedSoFar);
      }
    } finally {
      await restoreFn();
      overlay.style.display = 'flex';
      toast.remove();
    }
  }

  return { show };
})();
