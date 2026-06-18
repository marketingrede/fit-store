import { initAdminIcons } from './admin-icons.js';

function collectGalleryImages() {
  const images = [];
  const seen = new Set();

  const add = (src, label) => {
    const normalized = (src || '').trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    images.push({ src: normalized, label });
  };

  const mainImg = document.querySelector('[data-composer-img]');
  const mainUrl = document.querySelector('[data-composer-url]');
  const mainSrc = mainImg?.getAttribute('src') || mainUrl?.value?.trim() || '';

  if (mainSrc) {
    add(mainSrc, 'Imagem principal');
  }

  document.querySelectorAll('.variation-option').forEach((row) => {
    const card = row.closest('.variation-card');
    const attrName = card?.querySelector('.variation-name')?.value?.trim() || 'Variação';
    const optLabel = row.querySelector('.variation-option__label')?.value?.trim();
    const url = row.querySelector('.variation-option__image-url')?.value?.trim();
    const thumb = row.querySelector('.variation-option__thumb');
    const fileSrc = thumb && !thumb.hidden ? thumb.getAttribute('src') : '';
    const src = fileSrc || url;

    if (src) {
      add(src, optLabel ? `${attrName}: ${optLabel}` : attrName);
    }
  });

  return images;
}

export function initProductImageGallery(getComposerSrc) {
  const root = document.querySelector('[data-media-composer]');
  const preview = root?.querySelector('[data-composer-preview]');
  const img = root?.querySelector('[data-composer-img]');
  const dropzone = root?.querySelector('[data-composer-dropzone]');
  const changeBtn = root?.querySelector('[data-composer-change]');
  const removeBtn = root?.querySelector('[data-composer-remove]');
  const prevBtn = root?.querySelector('[data-gallery-prev]');
  const nextBtn = root?.querySelector('[data-gallery-next]');
  const counter = root?.querySelector('[data-gallery-counter]');
  const caption = root?.querySelector('[data-gallery-caption]');
  const zoomBtn = root?.querySelector('[data-gallery-zoom]');

  const lightbox = document.getElementById('productImageLightbox');
  const lightboxImg = lightbox?.querySelector('[data-lightbox-img]');
  const lightboxCaption = lightbox?.querySelector('[data-lightbox-caption]');
  const lightboxCounter = lightbox?.querySelector('[data-lightbox-counter]');
  const lightboxClose = lightbox?.querySelector('[data-lightbox-close]');
  const lightboxPrev = lightbox?.querySelector('[data-lightbox-prev]');
  const lightboxNext = lightbox?.querySelector('[data-lightbox-next]');

  if (!root || !preview || !img) {
    return { refresh: () => {} };
  }

  let images = [];
  let index = 0;
  let lightboxOpen = false;

  const isMainSlide = () => index === 0 && images[0]?.label === 'Imagem principal';

  const updateComposerActions = () => {
    const onMain = isMainSlide();
    if (changeBtn) changeBtn.hidden = !onMain;
    if (removeBtn) removeBtn.hidden = !onMain;
  };

  const updateNav = () => {
    const hasMany = images.length > 1;
    if (prevBtn) prevBtn.hidden = !hasMany;
    if (nextBtn) nextBtn.hidden = !hasMany;
    if (counter) {
      counter.hidden = !hasMany;
      counter.textContent = hasMany ? `${index + 1} / ${images.length}` : '';
    }
    if (caption) {
      const label = images[index]?.label;
      caption.hidden = !label;
      caption.textContent = label || '';
    }
    if (zoomBtn) zoomBtn.hidden = images.length === 0;
  };

  const showSlide = () => {
    if (!images.length) {
      preview.classList.remove('is-visible', 'is-gallery-view');
      if (dropzone) dropzone.style.display = '';
      img.removeAttribute('src');
      updateNav();
      updateComposerActions();
      return;
    }

    index = Math.max(0, Math.min(index, images.length - 1));
    const slide = images[index];

    img.src = slide.src;
    img.alt = slide.label;
    preview.classList.add('is-visible', 'is-gallery-view');
    if (dropzone) dropzone.style.display = 'none';

    updateNav();
    updateComposerActions();
  };

  const refresh = () => {
    const prevSrc = images[index]?.src;
    images = collectGalleryImages();

    if (prevSrc) {
      const found = images.findIndex((item) => item.src === prevSrc);
      index = found >= 0 ? found : 0;
    } else {
      index = 0;
    }

    if (!images.length && typeof getComposerSrc === 'function') {
      const composerSrc = getComposerSrc();
      if (composerSrc) {
        images = [{ src: composerSrc, label: 'Imagem principal' }];
        index = 0;
      }
    }

    showSlide();
  };

  const go = (delta) => {
    if (images.length < 2) return;
    index = (index + delta + images.length) % images.length;
    showSlide();
    if (lightboxOpen) syncLightbox();
  };

  const syncLightbox = () => {
    if (!lightbox || !lightboxImg || !images.length) return;

    const slide = images[index];
    lightboxImg.src = slide.src;
    lightboxImg.alt = slide.label;

    if (lightboxCaption) lightboxCaption.textContent = slide.label;
    if (lightboxCounter) {
      lightboxCounter.textContent = images.length > 1 ? `${index + 1} / ${images.length}` : '';
    }

    if (lightboxPrev) lightboxPrev.hidden = images.length < 2;
    if (lightboxNext) lightboxNext.hidden = images.length < 2;
  };

  const openLightbox = () => {
    if (!lightbox || !images.length) return;
    lightboxOpen = true;
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    syncLightbox();
    initAdminIcons(lightbox);
    lightboxClose?.focus();
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightboxOpen = false;
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    if (!document.getElementById('productFormOverlay')?.classList.contains('is-open')) {
      document.body.style.overflow = '';
    } else {
      document.body.style.overflow = 'hidden';
    }
  };

  prevBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    go(-1);
  });

  nextBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    go(1);
  });

  zoomBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length) openLightbox();
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', () => go(-1));
  lightboxNext?.addEventListener('click', () => go(1));

  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.hasAttribute('data-lightbox-backdrop')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!lightboxOpen) return;
    if (e.key === 'Escape') {
      e.stopImmediatePropagation();
      closeLightbox();
      return;
    }
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  }, true);

  document.addEventListener('composer:update', refresh);
  document.addEventListener('product-gallery:refresh', refresh);

  const variationsEditor = document.getElementById('variationsEditor');
  variationsEditor?.addEventListener('input', (e) => {
    if (e.target.matches('.variation-option__image-url, .variation-option__label, .variation-name')) {
      refresh();
    }
  });

  const formOverlay = document.getElementById('productFormOverlay');
  formOverlay?.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', closeLightbox);
  });

  refresh();

  return { refresh };
}
