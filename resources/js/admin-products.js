import { initProductVariationsEditor, loadProductVariations } from './admin-product-variations.js';
import { initMediaComposer } from './admin-image-upload.js';
import { initProductImageGallery } from './admin-product-gallery.js';
import { initAdminIcons } from './admin-icons.js';

const productsById = () => {
  const list = window.__ADMIN_PRODUCTS__ || [];
  return Object.fromEntries(list.map((p) => [String(p.id), p]));
};

const categories = () => window.__CATEGORIES__ || {};

let productMediaComposer = null;
let productImageGallery = null;

function bindModal(overlay) {
  if (!overlay) return { open: () => {}, close: () => {} };

  const close = () => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const open = () => {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    initAdminIcons(overlay);
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  overlay.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', close);
  });

  return { open, close };
}

function setFormError(message) {
  const el = document.getElementById('productFormError');
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.style.display = 'block';
  } else {
    el.textContent = '';
    el.style.display = 'none';
  }
}

function fillForm(product = null) {
  const form = document.getElementById('productForm');
  if (!form) return;

  const isEdit = product && product.id;
  form.action = isEdit ? `/admin/produtos/${product.id}` : '/admin/produtos';

  document.getElementById('productFormTitle').textContent = isEdit ? 'Editar produto' : 'Novo produto';
  document.getElementById('productName').value = product?.name ?? '';
  document.getElementById('productCategory').value = product?.category ?? '';
  document.getElementById('productPrice').value = product?.price_fitc ?? '';
  document.getElementById('productTag').value = product?.tag ?? '';
  document.getElementById('productDescription').value = product?.description ?? '';
  document.getElementById('productActive').checked = product ? Boolean(Number(product.active)) : true;

  const fileInput = document.getElementById('productImage');
  if (fileInput) fileInput.value = '';

  const composerRoot = document.querySelector('[data-media-composer]');
  if (!productMediaComposer && composerRoot) {
    productMediaComposer = initMediaComposer(composerRoot);
  }
  productMediaComposer?.setImageUrl(product?.image_url ?? '');

  const currentImage = document.getElementById('productCurrentImage');
  if (currentImage) {
    if (product?.image_url && isEdit) {
      currentImage.style.display = 'block';
      currentImage.textContent = 'Imagem atual salva no servidor. Envie uma nova para substituir.';
    } else {
      currentImage.style.display = 'none';
      currentImage.textContent = '';
    }
  }

  setFormError('');
  loadProductVariations(product?.variations || []);
  productImageGallery?.refresh();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPreview(product) {
  const categoryLabel = escapeHtml(categories()[product.category] || product.category || '—');
  const imageUrl = escapeHtml(product.image_url || 'https://placehold.co/600x450/e5e7eb/6b7280?text=Produto');
  const name = escapeHtml(product.name || '');
  const price = escapeHtml(product.price_fitc || 0);
  const storeUrl = `/produto/${product.id}`;

  const link = document.getElementById('productPreviewStoreLink');
  if (link) link.href = storeUrl;

  const body = document.getElementById('productPreviewBody');
  if (!body) return;

  body.innerHTML = `
    <div class="admin-product-preview">
      <p class="admin-product-preview__label">Card no catálogo da loja</p>
      <div class="admin-product-preview__frame">
        <article class="product-card product-card--preview">
          <div class="product-image">
            <img src="${imageUrl}" alt="${name}">
          </div>
          <div class="product-card__body">
            <h3 class="product-title">${name}</h3>
            <p class="product-meta-line">
              <span class="product-price-text">${price} FITC</span>
              <span class="product-meta-sep" aria-hidden="true">·</span>
              <span class="product-meta-category">${categoryLabel}</span>
            </p>
          </div>
        </article>
      </div>
    </div>
  `;
}

export function initAdminProducts() {
  const formOverlay = document.getElementById('productFormOverlay');
  const previewOverlay = document.getElementById('productPreviewOverlay');
  if (!formOverlay && !previewOverlay) return;

  const composerRoot = document.querySelector('[data-media-composer]');
  if (composerRoot) {
    productMediaComposer = initMediaComposer(composerRoot);
    productImageGallery = initProductImageGallery(() => productMediaComposer?.getPreviewSrc() || '');
  }

  document.addEventListener('variation-image:change', () => {
    productImageGallery?.refresh();
  });

  initProductVariationsEditor();

  const formModal = bindModal(formOverlay);
  const previewModal = bindModal(previewOverlay);
  const map = productsById();

  document.querySelector('[data-action="product-create"]')?.addEventListener('click', () => {
    fillForm(null);
    formModal.open();
  });

  document.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('[data-action="product-view"]');
    if (viewBtn) {
      const product = map[viewBtn.dataset.id];
      if (product) {
        renderPreview(product);
        previewModal.open();
      }
      return;
    }

    const editBtn = e.target.closest('[data-action="product-edit"]');
    if (editBtn) {
      const product = map[editBtn.dataset.id];
      if (product) {
        fillForm(product);
        formModal.open();
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    formModal.close();
    previewModal.close();
  });

  const pending = window.__MODAL_FORM__;
  if (pending?.open) {
    fillForm(pending.product || null);
    if (pending.error) setFormError(pending.error);
    formModal.open();
    delete window.__MODAL_FORM__;
  }

  const params = new URLSearchParams(window.location.search);
  params.delete('modal');
  params.delete('id');
  const listSuffix = params.toString() ? `?${params.toString()}` : '';

  if (params.get('modal') === 'create') {
    fillForm(null);
    formModal.open();
    window.history.replaceState({}, '', `/admin/produtos${listSuffix}`);
  } else if (params.get('modal') === 'edit' && params.get('id')) {
    const product = map[params.get('id')];
    if (product) {
      fillForm(product);
      formModal.open();
    }
    window.history.replaceState({}, '', `/admin/produtos${listSuffix}`);
  }
}
