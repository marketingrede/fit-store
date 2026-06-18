function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getDefaultSelections(product) {
  const selections = {};
  (product?.variations || []).forEach((attr) => {
    const first = attr.options?.[0];
    if (first) {
      selections[String(attr.id)] = String(first.id);
    }
  });
  return selections;
}

export function resolveProductPresentation(product, selections = {}) {
  const base = {
    image_url: product.image_url,
    price_fitc: product.price_fitc,
  };

  let image = product.image_url || '';
  let price = Number(product.price_fitc) || 0;

  (product.variations || []).forEach((attr) => {
    const chosenId = selections[String(attr.id)];
    if (!chosenId) return;

    const option = (attr.options || []).find((opt) => String(opt.id) === String(chosenId));
    if (!option) return;

    if (option.image_url) {
      image = option.image_url;
    }
    if (option.price_fitc_override != null && option.price_fitc_override !== '') {
      price = Number(option.price_fitc_override);
    }
  });

  return {
    ...base,
    image_url: image || base.image_url,
    price_fitc: price,
  };
}

export function validateSelections(product, selections = {}) {
  const missing = [];

  (product.variations || []).forEach((attr) => {
    if (!attr.required) return;
    const chosen = selections[String(attr.id)];
    if (!chosen) {
      missing.push(attr.name);
      return;
    }
    const valid = (attr.options || []).some((opt) => String(opt.id) === String(chosen));
    if (!valid) missing.push(attr.name);
  });

  if (missing.length) {
    return { ok: false, error: `Selecione: ${missing.join(', ')}.` };
  }

  return { ok: true };
}

export function formatSelectionSummary(product, selections = {}) {
  const lines = [];

  (product.variations || []).forEach((attr) => {
    const chosenId = selections[String(attr.id)];
    if (!chosenId) return;

    const option = (attr.options || []).find((opt) => String(opt.id) === String(chosenId));
    if (!option) return;

    let label = option.label;
    if (attr.unit) label += ` ${attr.unit}`;
    lines.push(`${attr.name}: ${label}`);
  });

  return lines;
}

export function renderVariationsHtml(product) {
  const variations = product.variations || [];
  if (!variations.length) return '';

  const blocks = variations.map((attr) => {
    const attrId = escapeHtml(attr.id);
    const label = escapeHtml(attr.name);
    const unit = attr.unit ? ` <span class="product-variation__unit">(${escapeHtml(attr.unit)})</span>` : '';
    const requiredMark = attr.required ? ' <span class="product-variation__required" aria-hidden="true">*</span>' : '';
    const optional = attr.required ? '' : ' <span class="product-variation__optional">(opcional)</span>';

    const options = (attr.options || []).map((opt, index) => {
      const optionId = escapeHtml(opt.id);
      const optionLabel = escapeHtml(opt.label);
      const image = opt.image_url ? escapeHtml(opt.image_url) : '';
      const priceOverride = opt.price_fitc_override ?? '';
      const checked = index === 0 ? 'checked' : '';

      return `
        <label class="product-variation__option">
          <input
            type="radio"
            name="variation-${attrId}"
            value="${optionId}"
            data-variation-input
            data-attribute-id="${attrId}"
            data-option-id="${optionId}"
            data-option-image="${image}"
            data-price-override="${escapeHtml(priceOverride)}"
            ${checked}
          >
          <span>${optionLabel}</span>
        </label>
      `;
    }).join('');

    return `
      <fieldset class="product-variation" data-variation-field data-attribute-id="${attrId}" data-required="${attr.required ? 'true' : 'false'}">
        <legend class="product-variation__label">${label}${unit}${requiredMark}${optional}</legend>
        <div class="product-variation__options" role="radiogroup" aria-label="${label}">
          ${options}
        </div>
      </fieldset>
    `;
  }).join('');

  return `<div class="product-variations" data-product-variations>${blocks}</div>`;
}

export function readSelectionsFromCard(card) {
  const selections = {};
  if (!card) return selections;

  card.querySelectorAll('[data-variation-input]:checked').forEach((input) => {
    selections[input.dataset.attributeId] = input.dataset.optionId;
  });

  return selections;
}

export function resolvePresentationForCard(card, product, selections) {
  const presentation = resolveProductPresentation(product, selections);

  if (!card) {
    return presentation;
  }

  card.querySelectorAll('[data-variation-input]:checked').forEach((input) => {
    const optionImage = input.dataset.optionImage?.trim();
    if (optionImage) {
      presentation.image_url = optionImage;
    }
  });

  return presentation;
}

export function applyPresentationToCard(card, product, selections) {
  if (!card) return;

  const presentation = resolvePresentationForCard(card, product, selections);
  const img = card.querySelector('.product-modal-card__media img, [data-product-image]');
  const priceEl = card.querySelector('.product-modal-card__price, [data-product-price]');

  if (img && presentation.image_url) {
    img.src = presentation.image_url;
    img.alt = product.name || img.alt || '';
  }
  if (priceEl) {
    priceEl.innerHTML = `${escapeHtml(presentation.price_fitc)} <span>FITC</span>`;
  }
}
