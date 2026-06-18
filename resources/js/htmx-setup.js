import htmx from 'htmx.org';
import NProgress from 'nprogress';
import {
  closeProductModal,
  handleDeepLinkProduct,
  initProductModal,
  isProductModalOpen,
  openProductModal,
} from './product-modal.js';
import { initCatalogUx, syncHeaderFromSwap } from './catalog-ux.js';
import { initCatalogInfinite } from './catalog-infinite.js';
import { initAnnouncementModal } from './announcement-modal.js';
import { initAdminIcons } from './admin-icons.js';
import { initColorPickers } from './admin-color-picker.js';
import { initAdminProductsBulk } from './admin-products-bulk.js';
import { initAdminSettings } from './admin-settings.js';

window.htmx = htmx;
htmx.config.scrollBehavior = 'auto';

function startProgress() {
  window.NProgress?.start();
}

function stopProgress() {
  window.NProgress?.done();
}

document.body.addEventListener('htmx:beforeRequest', (e) => {
  startProgress();

  const elt = e.detail.elt;
  if (!elt) return;

  if (elt.closest('[hx-get], [hx-post], [hx-put], [hx-delete]') && isProductModalOpen()) {
    const isCatalogNav = elt.closest('#spa-outlet, .filter-bar, .header-search, .filter-sheet, [data-filter-chip], [data-active-filters-scroll]')
      || elt.matches?.('[hx-get="/"], [hx-get^="/?"]')
      || (elt.getAttribute?.('hx-get') || '').startsWith('/');

    if (isCatalogNav && !elt.closest('#productModalDialog')) {
      closeProductModal();
    }
  }
});

document.body.addEventListener('htmx:afterRequest', stopProgress);

document.body.addEventListener('htmx:afterSwap', (e) => {
  const target = e.detail.target;

  if (target.id === 'spa-outlet') {
    syncHeaderFromSwap();
    initCatalogInfinite();
  }

  if (target.id === 'admin-products-list' || target.id === 'categories-tbody' || target.id === 'tags-tbody' || target.id === 'variations-list') {
    const script = target.querySelector('#admin-products-data');
    if (script) {
      try {
        window.__ADMIN_PRODUCTS__ = JSON.parse(script.textContent);
      } catch {
        window.__ADMIN_PRODUCTS__ = [];
      }
    }
    if (target.id === 'admin-products-list') {
      initAdminProductsBulk(target);
    }
    if (target.id === 'categories-tbody' || target.id === 'tags-tbody' || target.id === 'variations-list') {
      initAdminSettings(document);
    }
  }

  initAdminIcons();
  initColorPickers();
  if (target.id === 'settings-flash') {
    initAdminSettings(document);
  }
});

export function initHtmxApp() {
  initProductModal();
  initCatalogUx();
  initCatalogInfinite();
  initAnnouncementModal();

  if (window.location.pathname.match(/^\/produto\/\d+$/)) {
    handleDeepLinkProduct();
  } else {
    const catalogUrl = window.location.pathname + window.location.search || '/';
    history.replaceState({ catalogUrl }, '', catalogUrl);
  }

  window.addEventListener('popstate', () => {
    const match = window.location.pathname.match(/^\/produto\/(\d+)$/);
    if (match) {
      if (!isProductModalOpen()) {
        openProductModal(parseInt(match[1], 10));
      }
      return;
    }

    if (isProductModalOpen()) {
      closeProductModal();
    }
  });
}

export function initHtmxAdmin() {
  initAdminIcons();
  initColorPickers();
}
