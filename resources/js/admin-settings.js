function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseOptions(raw) {
  return String(raw ?? '')
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function renderOptionChips(textarea) {
  const container = textarea.closest('.field, td')?.querySelector('[data-option-chips]');
  if (!container) return;

  const options = parseOptions(textarea.value);
  container.innerHTML = options
    .map((option) => `<span class="admin-option-chip">${escapeHtml(option)}</span>`)
    .join('');
  container.setAttribute('aria-hidden', options.length ? 'false' : 'true');
}

function slugifyLabel(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function bindCategoryForm(form) {
  if (form.dataset.settingsBound) return;
  form.dataset.settingsBound = '1';

  const labelInput = form.querySelector('[data-cat-label]');
  const slugInput = form.querySelector('[data-cat-slug]');
  if (!labelInput || !slugInput) return;

  let slugTouched = false;

  slugInput.addEventListener('input', () => {
    slugTouched = slugInput.value.trim() !== '';
  });

  labelInput.addEventListener('input', () => {
    if (slugTouched) return;
    slugInput.value = slugifyLabel(labelInput.value);
  });

  form.addEventListener('reset', () => {
    slugTouched = false;
    slugInput.value = '';
  });
}

function bindTagNamePreview(nameInput, previewEl) {
  if (!nameInput || !previewEl) return;

  const update = () => {
    previewEl.textContent = nameInput.value.trim() || previewEl.dataset.fallback || 'Tag';
  };

  nameInput.addEventListener('input', update);
  update();
}

function bindTagRow(row) {
  if (row.dataset.settingsBound) return;
  row.dataset.settingsBound = '1';

  const preview = row.querySelector('[data-tag-preview]');
  const nameInput = row.querySelector('[data-tag-name-input]');
  bindTagNamePreview(nameInput, preview);
}

function bindNewTagForm(form) {
  if (form.dataset.settingsBound) return;
  form.dataset.settingsBound = '1';

  const preview = form.querySelector('[data-new-tag-preview]');
  const nameInput = form.querySelector('[data-tag-name-input]');
  const colorPicker = form.querySelector('[data-color-picker]');

  if (preview) preview.dataset.fallback = 'Nova tag';
  bindTagNamePreview(nameInput, preview);

  colorPicker?.addEventListener('colorchange', (event) => {
    preview?.style.setProperty('--tag-color', event.detail.hex);
  });
}

function bindOptionsInput(textarea) {
  if (textarea.dataset.optionsBound) return;
  textarea.dataset.optionsBound = '1';

  const render = () => renderOptionChips(textarea);
  textarea.addEventListener('input', render);
  render();
}

function bindNewVariationForm(form) {
  if (form.dataset.settingsBound) return;
  form.dataset.settingsBound = '1';

  form.querySelectorAll('[data-options-input]').forEach(bindOptionsInput);
  form.addEventListener('variation-form:reset', () => {
    form.querySelectorAll('[data-options-input]').forEach(renderOptionChips);
  });
}

function setVariationCardCollapsed(card, collapsed) {
  card.classList.toggle('is-collapsed', collapsed);
  const toggle = card.querySelector('[data-variation-toggle]');
  if (toggle) toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

function bindVariationCard(card) {
  if (card.dataset.variationBound) return;
  card.dataset.variationBound = '1';

  const toggle = card.querySelector('[data-variation-toggle]');
  toggle?.addEventListener('click', () => {
    setVariationCardCollapsed(card, !card.classList.contains('is-collapsed'));
  });

  const nameInput = card.querySelector('[data-variation-name-input]');
  const titleEl = card.querySelector('[data-variation-title]');
  nameInput?.addEventListener('input', () => {
    if (titleEl) titleEl.textContent = nameInput.value.trim() || 'Preset';
  });
}

function initVariationList(list) {
  if (!list) return;

  list.querySelectorAll('[data-variation-card]').forEach(bindVariationCard);

  if (list.dataset.variationsListBound) return;
  list.dataset.variationsListBound = '1';

  const root = list.closest('.admin-variations-page') || document;
  root.querySelector('[data-variation-expand-all]')?.addEventListener('click', () => {
    list.querySelectorAll('[data-variation-card]').forEach((card) => setVariationCardCollapsed(card, false));
  });
  root.querySelector('[data-variation-collapse-all]')?.addEventListener('click', () => {
    list.querySelectorAll('[data-variation-card]').forEach((card) => setVariationCardCollapsed(card, true));
  });
}

export function initAdminSettings(scope = document) {
  scope.querySelectorAll('[data-tag-row]').forEach(bindTagRow);

  const newTagForm = scope.querySelector('[data-new-tag-form]');
  if (newTagForm) bindNewTagForm(newTagForm);

  scope.querySelectorAll('[data-category-form]').forEach(bindCategoryForm);

  const newVariationForm = scope.querySelector('[data-new-variation-form]');
  if (newVariationForm) bindNewVariationForm(newVariationForm);

  scope.querySelectorAll('[data-new-variation-form] [data-options-input]').forEach(bindOptionsInput);

  const variationsList = scope.querySelector('[data-variations-list]');
  if (variationsList) initVariationList(variationsList);
}
