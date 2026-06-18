/**
 * Composer-style image upload with preview (Facebook/X pattern)
 */
export function initMediaComposer(root) {
  if (!root) return;

  const fileInput = root.querySelector('[data-composer-file]');
  const dropzone = root.querySelector('[data-composer-dropzone]');
  const preview = root.querySelector('[data-composer-preview]');
  const img = root.querySelector('[data-composer-img]');
  const urlInput = root.querySelector('[data-composer-url]');
  const changeBtn = root.querySelector('[data-composer-change]');
  const removeBtn = root.querySelector('[data-composer-remove]');

  if (!fileInput || !dropzone || !preview || !img) return;

  let objectUrl = null;

  const revokeObjectUrl = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  };

  const showPreview = (src) => {
    if (!src) {
      preview.classList.remove('is-visible');
      dropzone.style.display = '';
      img.removeAttribute('src');
      root.dispatchEvent(new CustomEvent('composer:update', { bubbles: true }));
      return;
    }

    img.src = src;
    preview.classList.add('is-visible');
    dropzone.style.display = 'none';
    root.dispatchEvent(new CustomEvent('composer:update', { bubbles: true }));
  };

  const setFromFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    revokeObjectUrl();
    objectUrl = URL.createObjectURL(file);
    showPreview(objectUrl);
    if (urlInput) urlInput.value = '';
  };

  const clearFile = () => {
    fileInput.value = '';
    revokeObjectUrl();
    showPreview('');
  };

  const openPicker = () => fileInput.click();

  dropzone.addEventListener('click', openPicker);
  changeBtn?.addEventListener('click', openPicker);

  removeBtn?.addEventListener('click', () => {
    clearFile();
    if (urlInput) urlInput.value = '';
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) setFromFile(file);
  });

  urlInput?.addEventListener('input', () => {
    const url = urlInput.value.trim();
    if (url) {
      clearFile();
      showPreview(url);
    } else if (!fileInput.files?.[0]) {
      showPreview('');
    }
  });

  ['dragenter', 'dragover'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });
  });

  ['dragleave', 'drop'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    setFromFile(file);
  });

  return {
    setImageUrl(url) {
      if (urlInput) urlInput.value = url || '';
      clearFile();
      showPreview(url || '');
    },
    clear() {
      clearFile();
      if (urlInput) urlInput.value = '';
    },
    getPreviewSrc() {
      if (objectUrl) return objectUrl;
      const url = urlInput?.value?.trim();
      if (url) return url;
      const src = img.getAttribute('src');
      return src || '';
    },
  };
}

/**
 * Small thumb preview for variation option file inputs
 */
export function bindVariationImagePreview(fileInput) {
  if (!fileInput || fileInput.dataset.previewBound) return;
  fileInput.dataset.previewBound = '1';

  let thumb = fileInput.parentElement?.querySelector('.variation-option__thumb');
  if (!thumb) {
    thumb = document.createElement('img');
    thumb.className = 'variation-option__thumb';
    thumb.alt = '';
    thumb.hidden = true;
    fileInput.parentElement?.insertBefore(thumb, fileInput);
  }

  let objectUrl = null;

  fileInput.addEventListener('change', () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const file = fileInput.files?.[0];
    if (!file) {
      thumb.hidden = true;
      thumb.removeAttribute('src');
      return;
    }
    objectUrl = URL.createObjectURL(file);
    thumb.src = objectUrl;
    thumb.hidden = false;
    fileInput.dispatchEvent(new CustomEvent('variation-image:change', { bubbles: true }));
  });
}

export function bindAllVariationImagePreviews(container) {
  container?.querySelectorAll('.variation-option__image-file').forEach(bindVariationImagePreview);
}
