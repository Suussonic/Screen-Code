/**
 * highlight.js
 * Gère l'encadré bleu + le label qui suivent la souris.
 * Expose : window.SCHighlight
 */
window.SCHighlight = (() => {
  const box = document.createElement('div');
  box.id = '__sc-highlight';
  box.style.cssText = `
    display: none;
    position: fixed;
    pointer-events: none;
    z-index: 2147483645;
    border: 2px solid #64c8ff;
    background: rgba(100, 200, 255, 0.08);
    border-radius: 2px;
    box-sizing: border-box;
    transition: left 60ms ease, top 60ms ease, width 60ms ease, height 60ms ease;
  `;

  const label = document.createElement('div');
  label.id = '__sc-label';
  label.style.cssText = `
    display: none;
    position: fixed;
    pointer-events: none;
    z-index: 2147483646;
    background: #64c8ff;
    color: #0f0f13;
    font: 700 11px/1 monospace;
    padding: 3px 7px;
    border-radius: 3px;
    white-space: nowrap;
  `;

  function _buildLabel(el) {
    const id  = el.id            ? `#${el.id}`                                     : '';
    const cls = el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '';
    return `<${el.tagName.toLowerCase()}${id}${cls}>`;
  }

  /** Monte les éléments dans le DOM */
  function mount() {
    if (!document.getElementById('__sc-highlight')) document.body.appendChild(box);
    if (!document.getElementById('__sc-label'))     document.body.appendChild(label);
  }

  /** Déplace l'encadré + le label sur l'élément donné */
  function moveTo(el) {
    const r = el.getBoundingClientRect();

    box.style.display = 'block';
    box.style.left    = r.left   + 'px';
    box.style.top     = r.top    + 'px';
    box.style.width   = r.width  + 'px';
    box.style.height  = r.height + 'px';

    label.style.display  = 'block';
    label.textContent    = _buildLabel(el);
    const lx = Math.min(r.left, window.innerWidth - label.offsetWidth - 4);
    const ly = r.top > 22 ? r.top - 22 : r.top + r.height + 2;
    label.style.left = lx + 'px';
    label.style.top  = ly + 'px';
  }

  /** Cache l'encadré et le label */
  function hide() {
    box.style.display   = 'none';
    label.style.display = 'none';
  }

  /** Retire les éléments du DOM */
  function remove() {
    box.remove();
    label.remove();
  }

  /** Retourne vrai si l'élément fait partie de l'UI interne */
  function isOwnElement(el) {
    return el === box || el === label;
  }

  return { mount, moveTo, hide, remove, isOwnElement };
})();
