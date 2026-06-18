import { appendCatalogProducts } from './product-modal.js';

let catalogObserver = null;
let catalogLoading = false;

function getGrid() {
  return document.querySelector('[data-products-grid]');
}

function getSentinel() {
  return document.querySelector('[data-catalog-sentinel]');
}

function getStatusEl() {
  return document.querySelector('[data-catalog-scroll-status]');
}

function setStatus(message, visible = false) {
  const el = getStatusEl();
  if (!el) return;
  el.textContent = message;
  el.hidden = !visible;
}

function buildNextPageUrl(page) {
  const url = new URL('/api/catalog/products', window.location.origin);
  url.searchParams.set('page', String(page));

  const current = new URL(window.location.href);
  const q = current.searchParams.get('q');
  if (q) url.searchParams.set('q', q);

  const categories = current.searchParams.getAll('categorias');
  categories.forEach((slug) => url.searchParams.append('categorias', slug));

  const tags = current.searchParams.getAll('tags');
  tags.forEach((tag) => url.searchParams.append('tags', tag));

  const legacy = current.searchParams.get('categoria');
  if (legacy && legacy !== 'all' && categories.length === 0) {
    url.searchParams.set('categoria', legacy);
  }

  return url;
}

async function loadNextCatalogPage() {
  const grid = getGrid();
  const sentinel = getSentinel();
  if (!grid || catalogLoading || grid.dataset.catalogHasMore !== 'true') return;

  const nextPage = parseInt(grid.dataset.catalogPage || '1', 10) + 1;
  catalogLoading = true;
  setStatus('Carregando mais produtos…', true);

  try {
    const res = await fetch(buildNextPageUrl(nextPage));
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      setStatus(data?.error || 'Não foi possível carregar mais produtos.', true);
      return;
    }

    if (data.html) {
      const template = document.createElement('template');
      template.innerHTML = data.html.trim();
      const nodes = [...template.content.children];
      nodes.forEach((node) => {
        if (sentinel) {
          grid.insertBefore(node, sentinel);
        } else {
          grid.appendChild(node);
        }
      });
    }

    if (Array.isArray(data.products) && data.products.length) {
      appendCatalogProducts(data.products);
    }

    grid.dataset.catalogPage = String(data.page ?? nextPage);
    grid.dataset.catalogHasMore = data.has_more ? 'true' : 'false';

    if (!data.has_more) {
      destroyCatalogInfinite();
      if (sentinel) sentinel.hidden = true;
      setStatus('Todos os produtos foram carregados.', true);
    } else {
      setStatus('', false);
    }
  } catch {
    setStatus('Erro de conexão. Role novamente para tentar.', true);
  } finally {
    catalogLoading = false;
  }
}

export function destroyCatalogInfinite() {
  catalogObserver?.disconnect();
  catalogObserver = null;
  catalogLoading = false;
}

export function initCatalogInfinite() {
  destroyCatalogInfinite();

  const grid = getGrid();
  const sentinel = getSentinel();
  if (!grid || !sentinel || grid.dataset.catalogHasMore !== 'true') {
    if (sentinel) sentinel.hidden = true;
    return;
  }

  sentinel.hidden = false;

  catalogObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadNextCatalogPage();
      }
    },
    { root: null, rootMargin: '240px 0px', threshold: 0 },
  );

  catalogObserver.observe(sentinel);
}
