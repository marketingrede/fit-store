import { bindAllVariationImagePreviews } from './admin-image-upload.js';
import { initAdminIcons } from './admin-icons.js';

let variationState = [];

function cloneVariations(list) {
  return JSON.parse(JSON.stringify(list || []));
}

function emptyVariation() {
  return {
    name: '',
    unit: '',
    required: true,
    allow_option_image: false,
    options: [{ label: '', image_url: '', price_fitc_override: '' }],
  };
}

function renderVariationsEditor() {
  const container = document.getElementById('variationsEditor');
  if (!container) return;

  if (!variationState.length) {
    container.innerHTML = '<p class="variations-editor__empty">Nenhuma variação cadastrada. Use o botão acima para adicionar.</p>';
    return;
  }

  container.innerHTML = variationState.map((attr, attrIndex) => {
    const optionsHtml = (attr.options || []).map((opt, optIndex) => `
      <div class="variation-option" data-attr-index="${attrIndex}" data-opt-index="${optIndex}">
        <input type="hidden" class="variation-option__image-persisted" value="${escapeHtml(opt.image_url || '')}">
        <input type="text" class="variation-option__label" placeholder="Opção (ex: P, 250, Preto)" value="${escapeHtml(opt.label || '')}">
        <input type="number" class="variation-option__price" min="1" placeholder="Preço FITC (opcional)" value="${escapeHtml(opt.price_fitc_override ?? '')}">
        ${attr.allow_option_image ? `
          <div class="variation-option__media">
            <input type="url" class="variation-option__image-url" placeholder="URL da imagem" value="${escapeHtml(opt.image_url || '')}">
            <input type="file" class="variation-option__image-file" name="variation_image_${attrIndex}_${optIndex}" accept="image/jpeg,image/png,image/webp">
          </div>
        ` : ''}
        <button type="button" class="btn-admin secondary variation-option__remove" data-action="remove-option"><i data-lucide="trash-2"></i></button>
      </div>
    `).join('');

    return `
      <div class="variation-card" data-attr-index="${attrIndex}">
        <div class="variation-card__header">
          <strong>Variação ${attrIndex + 1}</strong>
          <button type="button" class="btn-admin secondary" data-action="remove-variation">Excluir</button>
        </div>
        <div class="form-grid" style="gap:12px;">
          <div class="field">
            <label>Nome do atributo</label>
            <input type="text" class="variation-name" placeholder="Ex: Tamanho, Volume, Modelo" value="${escapeHtml(attr.name || '')}">
          </div>
          <div class="field">
            <label>Unidade (opcional)</label>
            <input type="text" class="variation-unit" placeholder="Ex: ml, g, kg" value="${escapeHtml(attr.unit || '')}">
          </div>
        </div>
        <div class="variation-card__flags">
          <label><input type="checkbox" class="variation-required" ${attr.required ? 'checked' : ''}> Obrigatório</label>
          <label><input type="checkbox" class="variation-allow-image" ${attr.allow_option_image ? 'checked' : ''}> Permitir imagem por opção</label>
        </div>
        <div class="variation-options">
          <div class="variation-options__header">
            <span>Opções</span>
            <button type="button" class="btn-admin secondary" data-action="add-option">+ Opção</button>
          </div>
          ${optionsHtml}
        </div>
      </div>
    `;
  }).join('');

  bindAllVariationImagePreviews(container);
  initAdminIcons(container);
  document.dispatchEvent(new CustomEvent('product-gallery:refresh'));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readStateFromDom() {
  const cards = document.querySelectorAll('.variation-card');
  const next = [];

  cards.forEach((card) => {
    const name = card.querySelector('.variation-name')?.value?.trim() || '';
    const unit = card.querySelector('.variation-unit')?.value?.trim() || '';
    const required = card.querySelector('.variation-required')?.checked ?? true;
    const allowImage = card.querySelector('.variation-allow-image')?.checked ?? false;
    const options = [];

    card.querySelectorAll('.variation-option').forEach((row) => {
      const label = row.querySelector('.variation-option__label')?.value?.trim() || '';
      if (!label) return;
      const priceRaw = row.querySelector('.variation-option__price')?.value;
      const imageUrl = row.querySelector('.variation-option__image-url')?.value?.trim()
        || row.querySelector('.variation-option__image-persisted')?.value?.trim()
        || '';

      options.push({
        label,
        image_url: imageUrl || null,
        price_fitc_override: priceRaw ? Number(priceRaw) : null,
      });
    });

    next.push({
      name,
      unit: unit || null,
      required,
      allow_option_image: allowImage,
      options,
    });
  });

  variationState = next;
}

function syncVariationsJson() {
  readStateFromDom();
  const filtered = variationState.filter((attr) => attr.name);
  const input = document.getElementById('variationsJson');
  if (input) input.value = JSON.stringify(filtered);
}

export function loadProductVariations(variations = []) {
  variationState = cloneVariations(variations);
  if (!variationState.length) {
    variationState = [];
  }
  renderVariationsEditor();
  syncVariationsJson();
}

export function initProductVariationsEditor() {
  const editor = document.getElementById('variationsEditor');
  const form = document.getElementById('productForm');
  if (!editor || !form) return;

  populatePresetSelect();

  document.getElementById('applyVariationPresetBtn')?.addEventListener('click', () => {
    const select = document.getElementById('variationPresetSelect');
    const presetId = select?.value;
    if (!presetId) return;

    const presets = window.__VARIATION_PRESETS__ || [];
    const preset = presets.find((p) => String(p.id) === String(presetId));
    if (!preset) return;

    readStateFromDom();
    variationState.push({
      name: preset.name,
      unit: preset.unit || '',
      required: Boolean(Number(preset.required)),
      allow_option_image: Boolean(Number(preset.allow_option_image)),
      options: (preset.options || []).map((label) => ({
        label: String(label),
        image_url: '',
        price_fitc_override: '',
      })),
    });
    renderVariationsEditor();
    syncVariationsJson();
    if (select) select.value = '';
  });

  document.getElementById('addVariationBtn')?.addEventListener('click', () => {
    readStateFromDom();
    variationState.push(emptyVariation());
    renderVariationsEditor();
    syncVariationsJson();
  });

  editor.addEventListener('click', (e) => {
    const attrCard = e.target.closest('.variation-card');
    const attrIndex = Number(attrCard?.dataset.attrIndex);

    if (e.target.closest('[data-action="remove-variation"]')) {
      readStateFromDom();
      variationState.splice(attrIndex, 1);
      renderVariationsEditor();
      syncVariationsJson();
      return;
    }

    if (e.target.closest('[data-action="add-option"]')) {
      readStateFromDom();
      if (variationState[attrIndex]) {
        variationState[attrIndex].options.push({ label: '', image_url: '', price_fitc_override: '' });
      }
      renderVariationsEditor();
      syncVariationsJson();
      return;
    }

    if (e.target.closest('[data-action="remove-option"]')) {
      const row = e.target.closest('.variation-option');
      const optIndex = Number(row?.dataset.optIndex);
      readStateFromDom();
      if (variationState[attrIndex]?.options) {
        variationState[attrIndex].options.splice(optIndex, 1);
        if (!variationState[attrIndex].options.length) {
          variationState[attrIndex].options.push({ label: '', image_url: '', price_fitc_override: '' });
        }
      }
      renderVariationsEditor();
      syncVariationsJson();
    }
  });

  editor.addEventListener('change', (e) => {
    if (e.target.classList.contains('variation-allow-image')) {
      readStateFromDom();
      renderVariationsEditor();
    }
    syncVariationsJson();
  });

  editor.addEventListener('input', () => {
    syncVariationsJson();
  });

  form.addEventListener('submit', () => {
    syncVariationsJson();
  });
}

function populatePresetSelect() {
  const select = document.getElementById('variationPresetSelect');
  if (!select) return;

  const presets = window.__VARIATION_PRESETS__ || [];
  const bar = document.getElementById('variationPresetBar');
  if (!presets.length) {
    if (bar) bar.style.display = 'none';
    return;
  }

  presets.forEach((preset) => {
    const opt = document.createElement('option');
    opt.value = preset.id;
    opt.textContent = `${preset.name}${preset.unit ? ` (${preset.unit})` : ''} — ${(preset.options || []).join(', ')}`;
    select.appendChild(opt);
  });
}
