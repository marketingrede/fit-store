const VARIANTS = ['teal', 'blue', 'surface'];

function syncContentVisibility(content, title, body, linkLabel) {
  const hasContent = Boolean(title || body || linkLabel);
  content.hidden = !hasContent;
}

function setPreviewImage(card, imgEl, url) {
  const hasImage = Boolean(url);
  card.classList.toggle('catalog-feature-card--has-image', hasImage);
  if (hasImage) {
    imgEl.hidden = false;
    imgEl.src = url;
  } else {
    imgEl.hidden = true;
    imgEl.removeAttribute('src');
  }
}

function showSaveStatus(editor, message, isError = false) {
  const status = editor.querySelector('[data-cta-save-status]');
  if (!status) return;

  status.textContent = message;
  status.hidden = false;
  status.classList.toggle('is-error', isError);
  status.classList.toggle('is-success', !isError);

  window.clearTimeout(status._hideTimer);
  status._hideTimer = window.setTimeout(() => {
    status.hidden = true;
  }, 3200);
}

async function persistActiveState(editor, activeInput) {
  const slot = editor.dataset.slot;
  const csrf = document.querySelector('form [name="_csrf"]')?.value;
  if (!slot || !csrf) {
    showSaveStatus(editor, 'Não foi possível salvar.', true);
    return false;
  }

  const active = activeInput.checked;
  const body = new URLSearchParams({
    _csrf: csrf,
    active: active ? '1' : '0',
  });

  try {
    const response = await fetch(`/admin/configuracoes/ctas/${slot}/ativo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: body.toString(),
      credentials: 'same-origin',
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || 'Falha ao salvar.');
    }

    showSaveStatus(editor, payload.message || 'Salvo na loja.');
    return true;
  } catch (error) {
    showSaveStatus(editor, error.message || 'Não foi possível salvar.', true);
    return false;
  }
}

function bindCtaEditor(editor) {
  const previewRoot = editor.querySelector('[data-cta-preview]');
  const card = editor.querySelector('[data-cta-preview-card]');
  if (!previewRoot || !card) return;

  const imgEl = card.querySelector('[data-cta-preview-image]');
  const content = card.querySelector('[data-cta-preview-content]');
  const titleEl = card.querySelector('[data-cta-preview-title]');
  const bodyEl = card.querySelector('[data-cta-preview-body]');
  const linkLabelEl = card.querySelector('[data-cta-preview-link-label]');
  const inactiveVeil = editor.querySelector('[data-cta-inactive-veil]');

  const titleInput = editor.querySelector('[data-cta-title]');
  const bodyInput = editor.querySelector('[data-cta-body]');
  const linkLabelInput = editor.querySelector('[data-cta-link-label]');
  const imageUrlInput = editor.querySelector('[data-cta-image-url]');
  const imageFileInput = editor.querySelector('[data-cta-image-file]');
  const removeImageInput = editor.querySelector('[data-cta-remove-image]');
  const activeInput = editor.querySelector('[data-cta-active]');
  const variantInputs = editor.querySelectorAll('[data-cta-variant]');
  const variantOptions = editor.querySelectorAll('[data-cta-variant-option]');

  let objectUrl = null;

  const revokeObjectUrl = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  };

  const currentImageUrl = () => {
    if (removeImageInput?.checked) return '';
    if (objectUrl) return objectUrl;
    return imageUrlInput?.value?.trim() || '';
  };

  const refreshPreview = () => {
    const title = titleInput?.value?.trim() || '';
    const body = bodyInput?.value?.trim() || '';
    const linkLabel = linkLabelInput?.value?.trim() || '';

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = body;
    if (linkLabelEl) linkLabelEl.textContent = linkLabel;
    if (content) syncContentVisibility(content, title, body, linkLabel);

    if (imgEl) setPreviewImage(card, imgEl, currentImageUrl());

    if (inactiveVeil && activeInput) {
      inactiveVeil.classList.toggle('is-visible', !activeInput.checked);
    }
  };

  const setVariant = (value) => {
    VARIANTS.forEach((variant) => {
      card.classList.toggle(`catalog-feature-card--${variant}`, variant === value);
    });
    variantOptions.forEach((option) => {
      const input = option.querySelector('[data-cta-variant]');
      option.classList.toggle('is-selected', input?.value === value);
    });
  };

  titleInput?.addEventListener('input', refreshPreview);
  bodyInput?.addEventListener('input', refreshPreview);
  linkLabelInput?.addEventListener('input', refreshPreview);
  activeInput?.addEventListener('change', async () => {
    refreshPreview();
    const previous = !activeInput.checked;
    const saved = await persistActiveState(editor, activeInput);
    if (!saved) {
      activeInput.checked = previous;
      refreshPreview();
    }
  });

  variantInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) setVariant(input.value);
    });
  });

  removeImageInput?.addEventListener('change', () => {
    if (removeImageInput.checked && imageFileInput) {
      imageFileInput.value = '';
      revokeObjectUrl();
    }
    refreshPreview();
  });

  imageFileInput?.addEventListener('change', () => {
    const file = imageFileInput.files?.[0];
    revokeObjectUrl();
    if (removeImageInput) removeImageInput.checked = false;

    if (file) {
      objectUrl = URL.createObjectURL(file);
    }
    refreshPreview();
  });

  editor.addEventListener('htmx:beforeSwap', revokeObjectUrl);
  window.addEventListener('pagehide', revokeObjectUrl);

  const checkedVariant = editor.querySelector('[data-cta-variant]:checked');
  if (checkedVariant) setVariant(checkedVariant.value);
  refreshPreview();
}

export function initAdminCtaEditor() {
  document.querySelectorAll('[data-cta-editor]').forEach(bindCtaEditor);
}
