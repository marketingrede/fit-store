import Swiper from 'swiper';
import { Keyboard, EffectCards } from 'swiper/modules';
import 'swiper/css/effect-cards';
import A11yDialog from 'a11y-dialog';
import { animate } from 'motion';
import { computePosition, offset, shift } from '@floating-ui/dom';
import { initTrade, destroyTrade } from './trade.js';
import { getCatalogUrl } from './catalog-state.js';
import htmx from 'htmx.org';
import {
  DESKTOP_GRID,
  MOBILE_GRID,
  renderProductSlideHtml,
  parseCatalogProductsJson,
  isMobileViewport,
} from './product-modal-utils.js';
import {
  readSelectionsFromCard,
  applyPresentationToCard,
} from './product-variation-utils.js';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMobileModal() {
  return isMobileViewport(window.innerWidth);
}

let productSwiper = null;
let modalProducts = [];
let modalOpen = false;
let a11yDialog = null;
let layoutListenersBound = false;

function getCategoryLabels() {
  const el = document.getElementById('category-labels');
  if (!el) return {};
  try {
    return JSON.parse(el.textContent);
  } catch {
    return {};
  }
}

export function getCatalogProducts() {
  const el = document.getElementById('catalog-products');
  if (!el) return [];
  return parseCatalogProductsJson(el.textContent);
}

export function appendCatalogProducts(newProducts) {
  const el = document.getElementById('catalog-products');
  if (!el || !Array.isArray(newProducts) || newProducts.length === 0) return;

  const existing = getCatalogProducts();
  const knownIds = new Set(existing.map((p) => Number(p.id)));

  const merged = [...existing];
  newProducts.forEach((product) => {
    const id = Number(product.id);
    if (!knownIds.has(id)) {
      knownIds.add(id);
      merged.push(product);
    }
  });

  el.textContent = JSON.stringify(merged);
}

export function setCatalogProducts(products) {
  const el = document.getElementById('catalog-products');
  if (!el) return;
  el.textContent = JSON.stringify(Array.isArray(products) ? products : []);
}

function renderSlide(product) {
  return renderProductSlideHtml(product, getCategoryLabels());
}

function syncDialogTitle(swiper = productSwiper) {
  document.querySelectorAll('.product-modal-card__title').forEach((el) => el.removeAttribute('id'));

  const dialog = document.getElementById('productModalDialog');
  if (!dialog) return;

  const idx = swiper?.activeIndex ?? 0;
  const slideEl = swiper?.slides?.[idx];
  const activeTitle = slideEl?.querySelector('.product-modal-card__title')
    ?? document.querySelector('.swiper-slide-active .product-modal-card__title');

  if (!activeTitle) return;

  activeTitle.id = 'productModalActiveTitle';
  dialog.setAttribute('aria-labelledby', 'productModalActiveTitle');
}

async function positionSwipeHint() {
  const modal = document.querySelector('.modal--product');
  const hint = document.getElementById('productModalSwipeHint');
  if (!modal || !hint) return;

  if (!isMobileModal()) {
    hint.style.display = 'none';
    hint.style.position = '';
    hint.style.left = '';
    hint.style.top = '';
    hint.style.transform = '';
    return;
  }

  hint.style.display = 'block';

  const { x, y } = await computePosition(modal, hint, {
    placement: 'bottom',
    middleware: [offset(8), shift({ padding: 12 })],
  });

  Object.assign(hint.style, {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translateX(-50%)',
  });
}

function animateModalIn() {
  const panel = document.querySelector('.modal--product');
  if (!panel || prefersReducedMotion()) return;

  animate(
    panel,
    {
      scale: [0.94, 1],
      y: [isMobileModal() ? 36 : 14, 0],
    },
    { duration: 0.42, easing: [0.34, 1.12, 0.64, 1] },
  );
}

async function animateModalOut() {
  const panel = document.querySelector('.modal--product');
  if (!panel || prefersReducedMotion()) return;

  await animate(
    panel,
    {
      scale: [1, 0.96],
      y: [0, isMobileModal() ? 24 : 10],
    },
    { duration: 0.22, easing: 'ease-in' },
  );
}

function clearCardMotionStyles(card) {
  card.classList.remove('is-media-expanded');
  card.style.gridTemplateColumns = '';
  card.style.gridTemplateRows = '';
  card.querySelectorAll('.product-modal-card__desc, .product-modal-card__hint, .cta-helper, [data-media-badge], [data-media-recall], .product-modal-card__media img').forEach((el) => {
    el.style.opacity = '';
    el.style.height = '';
    el.style.transform = '';
  });
}

function resetMediaExpanded() {
  document.querySelectorAll('.product-modal-card.is-media-expanded').forEach((card) => {
    const btn = card.querySelector('[data-image-focus]');
    clearCardMotionStyles(card);
    btn?.setAttribute('aria-pressed', 'false');
    btn?.setAttribute('aria-label', 'Ampliar imagem do produto');
  });
}

async function setMediaExpanded(card, btn, expand) {
  const desc = card.querySelector('.product-modal-card__desc');
  const hint = card.querySelector('.product-modal-card__hint');
  const helper = card.querySelector('.cta-helper');
  const img = card.querySelector('.product-modal-card__media img');
  const badge = card.querySelector('[data-media-badge]');
  const recall = card.querySelector('[data-media-recall]');
  const mobile = isMobileModal();
  const gridKey = mobile ? 'gridTemplateRows' : 'gridTemplateColumns';
  const grids = mobile ? MOBILE_GRID : DESKTOP_GRID;

  if (prefersReducedMotion()) {
    card.classList.toggle('is-media-expanded', expand);
    card.style[gridKey] = expand ? grids.expanded : grids.collapsed;
    btn.setAttribute('aria-pressed', expand ? 'true' : 'false');
    btn.setAttribute('aria-label', expand ? 'Recolher imagem do produto' : 'Ampliar imagem do produto');
    return;
  }

  if (expand) {
    card.classList.add('is-media-expanded');
    btn.setAttribute('aria-pressed', 'true');
    btn.setAttribute('aria-label', 'Recolher imagem do produto');

    await Promise.all([
      animate(card, { [gridKey]: [grids.collapsed, grids.expanded] }, { duration: 0.28, easing: [0.4, 0, 0.2, 1] }),
      img && animate(img, { scale: [1, 1.04] }, { duration: 0.26, easing: [0.4, 0, 0.2, 1] }),
      desc && animate(desc, { opacity: [1, 0], height: [`${desc.offsetHeight}px`, '0px'] }, { duration: 0.2 }),
      hint && animate(hint, { opacity: [1, 0], height: [`${hint.offsetHeight}px`, '0px'] }, { duration: 0.2 }),
      badge && animate(badge, { opacity: [1, 0], y: [0, 6] }, { duration: 0.16 }),
      recall && animate(recall, { opacity: [0, 1], y: [6, 0] }, { duration: 0.16 }),
      helper && animate(helper, { opacity: [1, 0] }, { duration: 0.16 }),
    ]);
    return;
  }

  btn.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-label', 'Ampliar imagem do produto');

  await Promise.all([
    animate(card, { [gridKey]: [grids.expanded, grids.collapsed] }, { duration: 0.28, easing: [0.4, 0, 0.2, 1] }),
    img && animate(img, { scale: [1.04, 1] }, { duration: 0.26, easing: [0.4, 0, 0.2, 1] }),
    desc && animate(desc, { opacity: [0, 1], height: ['0px', 'auto'] }, { duration: 0.2 }),
    hint && animate(hint, { opacity: [0, 1], height: ['0px', 'auto'] }, { duration: 0.2 }),
    badge && animate(badge, { opacity: [0, 1], y: [6, 0] }, { duration: 0.16 }),
    recall && animate(recall, { opacity: [1, 0], y: [0, 6] }, { duration: 0.16 }),
    helper && animate(helper, { opacity: [0, 1] }, { duration: 0.16 }),
  ]);

  clearCardMotionStyles(card);
}

async function toggleMediaFocus(btn) {
  const card = btn.closest('.product-modal-card');
  if (!card) return;

  const wasExpanded = card.classList.contains('is-media-expanded');

  if (wasExpanded) {
    await setMediaExpanded(card, btn, false);
    return;
  }

  document.querySelectorAll('.product-modal-card.is-media-expanded').forEach((other) => {
    if (other !== card) {
      const otherBtn = other.querySelector('[data-image-focus]');
      if (otherBtn) setMediaExpanded(other, otherBtn, false);
    }
  });

  await setMediaExpanded(card, btn, true);
}

function initTradeForActiveSlide(swiper = productSwiper) {
  if (!swiper || swiper.destroyed || !modalProducts.length) return;
  const product = modalProducts[swiper.activeIndex];
  if (!product) return;

  const slideEl = swiper.slides?.[swiper.activeIndex];
  const card = slideEl?.querySelector('[data-product-card]')
    ?? document.querySelector('.swiper-slide-active [data-product-card]');
  destroyTrade();
  initTrade(product, {
    openBtnSelector: '.swiper-slide-active [data-open-trade]',
    getSelections: () => readSelectionsFromCard(card),
    getActiveCard: () => card,
  });
}

function syncActiveSlidePresentation() {
  if (!productSwiper || !modalProducts.length) return;
  const product = modalProducts[productSwiper.activeIndex];
  const card = document.querySelector('.swiper-slide-active [data-product-card]');
  if (!product || !card) return;
  applyPresentationToCard(card, product, readSelectionsFromCard(card));
}

function syncAllSlidePresentations() {
  document.querySelectorAll('.swiper-slide[data-product-id]').forEach((slide) => {
    const product = modalProducts.find((p) => String(p.id) === slide.dataset.productId);
    const card = slide.querySelector('[data-product-card]');
    if (product && card) {
      applyPresentationToCard(card, product, readSelectionsFromCard(card));
    }
  });
}

function updateUrlForProduct(id) {
  history.replaceState({ productModal: true, catalogUrl: getCatalogUrl() || '/' }, '', `/produto/${id}`);
}

function createProductSwiper(initialIndex) {
  const mobile = isMobileModal();
  const modules = mobile ? [Keyboard, EffectCards] : [Keyboard];

  return new Swiper('#productModalSwiper', {
    modules,
    effect: mobile ? 'cards' : 'slide',
    initialSlide: initialIndex,
    keyboard: { enabled: true },
    speed: mobile ? 380 : 320,
    grabCursor: mobile,
    cardsEffect: {
      slideShadows: false,
      rotate: true,
      perSlideRotate: 2.5,
      perSlideOffset: 12,
    },
    on: {
      afterInit(swiper) {
        syncDialogTitle(swiper);
        initTradeForActiveSlide(swiper);
      },
      slideChange(swiper) {
        if (!swiper || swiper.destroyed) return;
        const p = modalProducts[swiper.activeIndex];
        if (p) updateUrlForProduct(p.id);
        syncDialogTitle(swiper);
        initTradeForActiveSlide(swiper);
      },
      slideChangeTransitionEnd(swiper) {
        if (!swiper || swiper.destroyed) return;
        resetMediaExpanded();
      },
    },
  });
}

function teardownSwiper() {
  if (!productSwiper) return;
  const instance = productSwiper;
  productSwiper = null;
  instance.destroy(true, true);
}

export function isProductModalOpen() {
  return modalOpen;
}

export async function openProductModal(productId) {
  modalProducts = getCatalogProducts();
  if (!modalProducts.length || !a11yDialog) return;

  const index = modalProducts.findIndex((p) => Number(p.id) === Number(productId));
  if (index < 0) return;

  const wrapper = document.getElementById('productModalWrapper');
  if (!wrapper) return;

  wrapper.innerHTML = modalProducts.map(renderSlide).join('');
  syncAllSlidePresentations();
  teardownSwiper();
  productSwiper = createProductSwiper(index);
  syncDialogTitle();

  modalOpen = true;
  a11yDialog.show();

  requestAnimationFrame(() => {
    syncDialogTitle();
    initTradeForActiveSlide();
    animateModalIn();
    positionSwipeHint();
  });

  const catalogUrl = window.location.pathname + window.location.search || '/';
  history.pushState({ productModal: true, catalogUrl }, '', `/produto/${modalProducts[index].id}`);
}

export async function closeProductModal() {
  if (!modalOpen || !a11yDialog) return;

  await animateModalOut();
  a11yDialog.hide();
}

function bindLayoutListeners() {
  if (layoutListenersBound) return;
  layoutListenersBound = true;

  window.addEventListener('resize', () => {
    if (modalOpen) positionSwipeHint();
  });
}

export function initProductModal() {
  const root = document.getElementById('productModalDialog');
  if (!root) return;

  a11yDialog = new A11yDialog(root);

  a11yDialog.on('show', () => {
    root.setAttribute('aria-hidden', 'false');
  });

  a11yDialog.on('hide', () => {
    root.setAttribute('aria-hidden', 'true');
    requestAnimationFrame(() => root.setAttribute('aria-hidden', 'true'));
  });

  a11yDialog.on('hide', () => {
    if (!modalOpen) return;

    modalOpen = false;
    destroyTrade();
    resetMediaExpanded();
    teardownSwiper();

    const catalogUrl = '/';
    history.replaceState({ catalogUrl }, '', catalogUrl);
  });

  document.getElementById('productModalPrev')?.addEventListener('click', () => productSwiper?.slidePrev());
  document.getElementById('productModalNext')?.addEventListener('click', () => productSwiper?.slideNext());

  document.getElementById('productModalSwiper')?.addEventListener('change', (e) => {
    const input = e.target.closest('[data-variation-input]');
    if (!input) return;

    const card = input.closest('[data-product-card]');
    const slide = input.closest('[data-product-id]');
    const product = slide
      ? modalProducts.find((p) => String(p.id) === slide.dataset.productId)
      : null;

    if (product && card) {
      applyPresentationToCard(card, product, readSelectionsFromCard(card));
    }

    if (card?.closest('.swiper-slide-active')) {
      initTradeForActiveSlide();
    }
  });

  document.getElementById('productModalSwiper')?.addEventListener('click', (e) => {
    const focusBtn = e.target.closest('[data-image-focus]');
    if (!focusBtn) return;
    e.preventDefault();
    toggleMediaFocus(focusBtn);
  });

  document.addEventListener('keydown', (e) => {
    if (!modalOpen) return;
    if (e.key === 'ArrowLeft') productSwiper?.slidePrev();
    if (e.key === 'ArrowRight') productSwiper?.slideNext();
  });

  document.getElementById('productModalClose')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeProductModal();
  });

  root.querySelector('.product-modal-backdrop')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeProductModal();
  });

  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-product-open]');
    if (!card) return;
    e.preventDefault();
    openProductModal(card.dataset.productId);
  });

  bindLayoutListeners();
}

export function handleDeepLinkProduct() {
  const match = window.location.pathname.match(/^\/produto\/(\d+)$/);
  if (!match) return;

  const productId = parseInt(match[1], 10);
  const outlet = document.getElementById('spa-outlet');

  if (outlet?.querySelector('[data-page="home"]')) {
    openProductModal(productId);
    return;
  }

  navigateToHomeThenOpen(productId);
}

async function navigateToHomeThenOpen(productId) {
  const catalogUrl = getCatalogUrl() || '/';
  const outlet = document.getElementById('spa-outlet');

  if (!outlet?.querySelector('[data-page="home"]')) {
    await new Promise((resolve) => {
      const handler = (e) => {
        if (e.detail.target?.id === 'spa-outlet') {
          document.body.removeEventListener('htmx:afterSwap', handler);
          resolve();
        }
      };
      document.body.addEventListener('htmx:afterSwap', handler);
      htmx.ajax('GET', catalogUrl, { target: '#spa-outlet', swap: 'innerHTML' });
    });
  }

  openProductModal(productId);
}
