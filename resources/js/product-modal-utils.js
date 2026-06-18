export const DESKTOP_GRID = {
  collapsed: 'minmax(0, 1fr) minmax(0, 1.05fr)',
  expanded: 'minmax(0, 1.75fr) minmax(0, 0.65fr)',
};

export const MOBILE_GRID = {
  collapsed: 'minmax(200px, 46%) auto',
  expanded: 'minmax(260px, 68%) auto',
};

export const MOBILE_BREAKPOINT_PX = 768;

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function isMobileViewport(width) {
  return width <= MOBILE_BREAKPOINT_PX;
}

export function getGridConfig(viewportWidth) {
  return isMobileViewport(viewportWidth)
    ? { key: 'gridTemplateRows', grids: MOBILE_GRID }
    : { key: 'gridTemplateColumns', grids: DESKTOP_GRID };
}

import { renderVariationsHtml } from './product-variation-utils.js';

export function renderProductSlideHtml(product, categoryLabels = {}) {
  const img = product.image_url || 'https://placehold.co/600x450/e5e7eb/6b7280?text=Produto';
  const variationsHtml = renderVariationsHtml(product);

  return `
    <div class="swiper-slide" data-product-id="${escapeHtml(product.id)}">
      <article class="product-modal-card" data-product-card>
        <button type="button" class="product-modal-card__media" data-image-focus aria-pressed="false" aria-label="Ampliar imagem do produto">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(product.name)}" data-product-image>
          <span class="product-modal-card__media-watermark" aria-hidden="true">Imagens meramente ilustrativas</span>
          <span class="product-modal-card__media-badge" data-media-badge aria-hidden="true">
            <span>Ampliar</span>
          </span>
          <span class="product-modal-card__media-recall" data-media-recall aria-hidden="true">
            <span>Recolher</span>
          </span>
        </button>
        <div class="product-modal-card__body">
          <p class="product-modal-card__meta">Tag: ${escapeHtml(product.tag || 'Geral')}</p>
          <h2 class="product-modal-card__title">${escapeHtml(product.name)}</h2>
          <div class="product-modal-card__details">
            <p class="product-modal-card__desc">${escapeHtml(product.description || '')}</p>
            ${variationsHtml}
            <p class="product-modal-card__price" data-product-price>${escapeHtml(product.price_fitc)} <span>FITC</span></p>
            <p class="product-modal-card__hint">Use seu saldo de Fitcoin para resgatar este produto.</p>
            <div class="product-modal-card__cta">
              <button type="button" class="cta-btn" data-open-trade>Quero trocar meus Fitcoin</button>
              <span class="cta-helper">Você receberá contato por e-mail.</span>
            </div>
          </div>
        </div>
      </article>
    </div>
  `;
}

export function parseCatalogProductsJson(raw) {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
