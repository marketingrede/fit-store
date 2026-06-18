import {
  resolveProductPresentation,
  validateSelections,
  formatSelectionSummary,
} from './product-variation-utils.js';

let tradeInitialized = false;
let tradeHandlers = [];

function addHandler(target, event, fn) {
  if (!target) return;
  target.addEventListener(event, fn);
  tradeHandlers.push({ target, event, fn });
}

export function destroyTrade() {
  tradeHandlers.forEach(({ target, event, fn }) => {
    target.removeEventListener(event, fn);
  });
  tradeHandlers = [];
  tradeInitialized = false;

  const orderReview = document.getElementById('orderReview');
  if (orderReview) orderReview.innerHTML = '';
}

export function initTrade(product, options = {}) {
  if (!product) return;
  destroyTrade();

  const getSelections = options.getSelections || (() => ({}));

  const openBtn = options.openBtnSelector
    ? document.querySelector(options.openBtnSelector)
    : document.getElementById('openTradeBtn');

  const overlay = document.getElementById('tradeOverlay');
  const closeBtn = document.getElementById('tradeCloseBtn');
  const form = document.getElementById('tradeForm');
  const statusEl = document.getElementById('tradeStatus');
  const submitBtn = document.getElementById('tradeSubmitBtn');
  const subtitleEl = document.getElementById('tradeSubtitle');
  const orderReviewEl = document.getElementById('orderReview');
  const csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

  let pendingOrder = null;

  function currentPresentation() {
    const selections = getSelections();
    return resolveProductPresentation(product, selections);
  }

  function openModal() {
    const check = validateSelections(product, getSelections());
    if (!check.ok) {
      if (statusEl) statusEl.textContent = check.error;
      return;
    }

    const presentation = currentPresentation();
    const summary = formatSelectionSummary(product, getSelections());
    const variationText = summary.length ? ` · ${summary.join(' · ')}` : '';

    if (!subtitleEl) return;
    subtitleEl.textContent = `Produto: ${product.name}${variationText} (${presentation.price_fitc} FITC)`;
    overlay?.classList.add('is-open');
    overlay?.setAttribute('aria-hidden', 'false');
    if (statusEl) statusEl.textContent = '';
    document.getElementById('tradeName')?.focus();
  }

  function closeModal() {
    overlay?.classList.remove('is-open');
    overlay?.setAttribute('aria-hidden', 'true');
  }

  addHandler(openBtn, 'click', openModal);
  addHandler(closeBtn, 'click', closeModal);
  addHandler(overlay, 'click', (e) => {
    if (e.target === overlay) closeModal();
  });

  const escHandler = (e) => {
    if (e.key === 'Escape' && overlay?.classList.contains('is-open')) closeModal();
  };
  addHandler(document, 'keydown', escHandler);

  addHandler(form, 'submit', (e) => {
    e.preventDefault();

    const name = String(document.getElementById('tradeName')?.value || '').trim();
    const email = String(document.getElementById('tradeEmail')?.value || '').trim();

    if (!name || !email) {
      if (statusEl) statusEl.textContent = 'Preencha nome e e-mail.';
      return;
    }

    const selections = getSelections();
    const check = validateSelections(product, selections);
    if (!check.ok) {
      if (statusEl) statusEl.textContent = check.error;
      return;
    }

    const presentation = currentPresentation();
    const summary = formatSelectionSummary(product, selections);

    pendingOrder = {
      name,
      email,
      productId: product.id,
      productName: product.name,
      productPriceFitc: presentation.price_fitc,
      productSelection: selections,
      selectionSummary: summary,
    };

    if (orderReviewEl) {
      const variationRows = summary.length
        ? summary.map((line) => `<div><span class="label">Variação:</span> ${line}</div>`).join('')
        : '';

      orderReviewEl.innerHTML = `
        <div class="order-review-card">
          <div class="order-review-title">Resumo do pedido</div>
          <div class="order-review-list">
            <div><span class="label">Produto:</span> ${pendingOrder.productName} (${pendingOrder.productPriceFitc} FITC)</div>
            ${variationRows}
            <div><span class="label">Nome:</span> ${pendingOrder.name}</div>
            <div><span class="label">E-mail:</span> ${pendingOrder.email}</div>
          </div>
          <div class="order-review-actions">
            <button class="confirm-btn" id="confirmSendBtn" type="button">Confirmar e enviar</button>
            <div class="order-status-text" id="orderStatusText"></div>
          </div>
        </div>
      `;
    }

    if (statusEl) statusEl.textContent = 'Confira os dados abaixo antes de enviar.';
    if (submitBtn) submitBtn.disabled = false;
    closeModal();
  });

  const confirmHandler = async (e) => {
    if (!pendingOrder || e.target?.id !== 'confirmSendBtn') return;

    const statusText = document.getElementById('orderStatusText');
    const confirmBtn = document.getElementById('confirmSendBtn');
    if (!statusText || !confirmBtn) return;

    statusText.textContent = 'Enviando...';
    confirmBtn.disabled = true;

    try {
      const fd = new FormData();
      fd.append('_csrf', csrf);
      fd.append('name', pendingOrder.name);
      fd.append('email', pendingOrder.email);
      fd.append('productId', String(pendingOrder.productId));
      fd.append('productName', pendingOrder.productName);
      fd.append('productPriceFitc', String(pendingOrder.productPriceFitc));
      fd.append('productSelection', JSON.stringify(pendingOrder.productSelection || {}));

      const res = await fetch('/api/troca-fitcoin', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        statusText.textContent = data?.error || 'Não foi possível enviar. Tente novamente.';
        confirmBtn.disabled = false;
        return;
      }

      statusText.textContent = 'Pedido enviado com sucesso!';
      pendingOrder = null;
    } catch {
      statusText.textContent = 'Erro de conexão. Tente novamente.';
      confirmBtn.disabled = false;
    }
  };
  addHandler(document, 'click', confirmHandler);

  tradeInitialized = true;
}

// SSR inicial sem router
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('spa-outlet')) return;
  const el = document.getElementById('product-json');
  if (el) {
    try {
      initTrade(JSON.parse(el.textContent));
    } catch { /* ignore */ }
  }
});
