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

export function initAdminSettings(scope = document) {
  scope.querySelectorAll('[data-tag-row]').forEach(bindTagRow);

  const newTagForm = scope.querySelector('[data-new-tag-form]');
  if (newTagForm) bindNewTagForm(newTagForm);

  const newVariationForm = scope.querySelector('[data-new-variation-form]');
  if (newVariationForm) bindNewVariationForm(newVariationForm);

  scope.querySelectorAll('[data-new-variation-form] [data-options-input]').forEach(bindOptionsInput);
}
