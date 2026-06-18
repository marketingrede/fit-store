function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex) {
  const raw = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  const toHex = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsv(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;

  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : d / max;
  const v = max;

  return { h, s, v };
}

function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  };
}

function normalizeHex(value) {
  let hex = String(value || '').trim();
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : null;
}

function bindColorPicker(root) {
  const hidden = root.querySelector('[data-color-value]');
  const trigger = root.querySelector('[data-color-trigger]');
  const popover = root.querySelector('[data-color-popover]');
  const swatch = root.querySelector('[data-color-swatch]');
  const sv = root.querySelector('[data-color-sv]');
  const svCursor = root.querySelector('[data-color-sv-cursor]');
  const hueInput = root.querySelector('[data-color-hue]');
  const hexInput = root.querySelector('[data-color-hex]');
  const nativeInput = root.querySelector('[data-color-native]');

  if (!hidden || !trigger || !popover || !sv || !hueInput || !hexInput) return;

  let hue = 0;
  let sat = 1;
  let val = 1;
  let draggingSv = false;

  const applyHex = (hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    hue = hsv.h;
    sat = hsv.s;
    val = hsv.v;
    render();
    return true;
  };

  const currentHex = () => {
    const rgb = hsvToRgb(hue, sat, val);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  };

  const render = () => {
    const hex = currentHex();
    hidden.value = hex;
    hexInput.value = hex;
    if (nativeInput) nativeInput.value = hex;
    if (swatch) swatch.style.background = hex;
    const preview = root.closest('tr')?.querySelector('[data-tag-preview]');
    if (preview) preview.style.setProperty('--tag-color', hex);
    const pure = hsvToRgb(hue, 1, 1);
    sv.style.backgroundColor = rgbToHex(pure.r, pure.g, pure.b);
    hueInput.value = String(Math.round(hue));
    svCursor.style.left = `${sat * 100}%`;
    svCursor.style.top = `${(1 - val) * 100}%`;
    root.dispatchEvent(new CustomEvent('colorchange', { detail: { hex } }));
  };

  const setFromSvEvent = (e) => {
    const rect = sv.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    sat = x;
    val = 1 - y;
    render();
  };

  const open = () => {
    popover.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
  };

  const close = () => {
    popover.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  };

  const toggle = () => {
    if (popover.hidden) open();
    else close();
  };

  applyHex(normalizeHex(root.dataset.initial || hidden.value) || '#0f766e');

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });

  hueInput.addEventListener('input', () => {
    hue = Number(hueInput.value);
    render();
  });

  hexInput.addEventListener('change', () => {
    const hex = normalizeHex(hexInput.value);
    if (hex) applyHex(hex);
    else hexInput.value = currentHex();
  });

  hexInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      hexInput.blur();
    }
  });

  nativeInput?.addEventListener('input', () => {
    const hex = normalizeHex(nativeInput.value);
    if (hex) applyHex(hex);
  });

  sv.addEventListener('mousedown', (e) => {
    draggingSv = true;
    setFromSvEvent(e);
  });

  window.addEventListener('mousemove', (e) => {
    if (!draggingSv) return;
    setFromSvEvent(e);
  });

  window.addEventListener('mouseup', () => {
    draggingSv = false;
  });

  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !popover.hidden) close();
  });
}

export function initColorPickers(scope = document) {
  scope.querySelectorAll('[data-color-picker]').forEach((root) => {
    if (root.dataset.colorPickerBound) return;
    root.dataset.colorPickerBound = '1';
    bindColorPicker(root);
  });
}
