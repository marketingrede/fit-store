let catalogUxBound = false;
let filterSheetSelection = [];
let searchDebounceTimer = null;

function getCategoryLabels() {
  const el = document.getElementById('category-labels');
  if (!el) return {};
  try {
    return JSON.parse(el.textContent);
  } catch {
    return {};
  }
}

function readActiveCategories() {
  const el = document.getElementById('active-categories');
  if (!el) return [];
  try {
    return JSON.parse(el.textContent);
  } catch {
    return [];
  }
}

function readActiveTags() {
  const el = document.getElementById('active-tags');
  if (!el) return [];
  try {
    return JSON.parse(el.textContent);
  } catch {
    return [];
  }
}

function updateClearButton(input) {
  const clear = document.getElementById('headerSearchClear');
  const kbd = document.getElementById('headerSearchKbd');
  const hasValue = Boolean(input?.value);
  if (clear) clear.hidden = !hasValue;
  if (kbd) kbd.hidden = hasValue;
}

function syncHiddenCategoryFields(categories) {
  document.querySelectorAll('[data-search-category-fields]').forEach((container) => {
    container.innerHTML = categories
      .map((slug) => `<input type="hidden" name="categorias" value="${slug}">`)
      .join('');
  });
}

function syncHiddenTagFields(tags) {
  document.querySelectorAll('[data-search-tag-fields]').forEach((container) => {
    container.innerHTML = tags
      .map((tag) => `<input type="hidden" name="tags" value="${tag}">`)
      .join('');
  });
}

function updateFilterToggleCount(categories, tags = []) {
  const badge = document.getElementById('filterToggleCount');
  if (!badge) return;
  const count = categories.length + tags.length;
  if (count === 0) {
    badge.hidden = true;
    badge.textContent = '0';
  } else {
    badge.hidden = false;
    badge.textContent = String(count);
  }
}

function syncFilterSheetCheckboxes(categories) {
  const selection = filterSheetSelection.length ? filterSheetSelection : categories;
  document.querySelectorAll('[data-filter-sheet-chip]').forEach((chip) => {
    const input = chip.querySelector('input[type="checkbox"]') || chip;
    const slug = chip.dataset.category || input.value;
    const active = selection.includes(slug);
    chip.classList.toggle('active', active);
    if (input.type === 'checkbox') input.checked = active;
  });
}

function bindSearchDebounce(input, form) {
  if (!input || !form) return;

  input.addEventListener('input', () => {
    const desktop = document.getElementById('headerSearchInput');
    const mobile = document.querySelector('[data-mobile-search-input]');
    if (desktop && mobile && input === desktop) mobile.value = input.value;
    if (desktop && mobile && input === mobile) desktop.value = input.value;
    updateClearButton(input);

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => form.requestSubmit(), 400);
  });
}

export function closeFilterSheet() {
  const sheet = document.getElementById('filterSheet');
  const backdrop = document.getElementById('filterSheetBackdrop');
  const toggle = document.getElementById('filterToggle');
  if (!sheet || !backdrop) return;

  sheet.hidden = true;
  backdrop.hidden = true;
  document.body.classList.remove('filter-sheet-open');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
  filterSheetSelection = [];
}

function openFilterSheet() {
  const sheet = document.getElementById('filterSheet');
  const backdrop = document.getElementById('filterSheetBackdrop');
  const toggle = document.getElementById('filterToggle');
  if (!sheet || !backdrop) return;

  filterSheetSelection = [...readActiveCategories()];
  syncFilterSheetCheckboxes(filterSheetSelection);

  sheet.hidden = false;
  backdrop.hidden = false;
  document.body.classList.add('filter-sheet-open');
  if (toggle) toggle.setAttribute('aria-expanded', 'true');
}

function initSearchShortcut() {
  const mod = document.querySelector('[data-search-kbd-mod]');
  if (mod) {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    mod.textContent = isMac ? '⌘' : 'Ctrl';
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const desktop = document.getElementById('headerSearchInput');
      const mobile = document.querySelector('[data-mobile-search-input]');
      const target = window.innerWidth < 641 ? mobile : desktop;
      target?.focus();
      target?.select();
    }
  });
}

export function syncHeaderFromSwap() {
  const url = new URL(window.location.href);
  const q = url.searchParams.get('q') || '';
  const desktop = document.getElementById('headerSearchInput');
  const mobile = document.querySelector('[data-mobile-search-input]');

  if (desktop) desktop.value = q;
  if (mobile) mobile.value = q;
  updateClearButton(desktop || mobile);

  const categories = readActiveCategories();
  const tags = readActiveTags();
  syncHiddenCategoryFields(categories);
  syncHiddenTagFields(tags);
  updateFilterToggleCount(categories, tags);
  syncFilterSheetCheckboxes(categories);
  closeFilterSheet();
}

export function initCatalogUx() {
  if (!catalogUxBound) {
    catalogUxBound = true;
    initSearchShortcut();

    document.getElementById('filterToggle')?.addEventListener('click', openFilterSheet);
    document.getElementById('filterSheetBackdrop')?.addEventListener('click', closeFilterSheet);
    document.getElementById('filterSheetClose')?.addEventListener('click', closeFilterSheet);

    document.getElementById('filterSheetClear')?.addEventListener('click', () => {
      filterSheetSelection = [];
      syncFilterSheetCheckboxes([]);
    });

    document.getElementById('filterSheetApply')?.addEventListener('click', () => {
      document.getElementById('filterSheetForm')?.requestSubmit();
    });

    document.getElementById('headerSearchClear')?.addEventListener('click', () => {
      const desktop = document.getElementById('headerSearchInput');
      const mobile = document.querySelector('[data-mobile-search-input]');
      if (desktop) desktop.value = '';
      if (mobile) mobile.value = '';
      updateClearButton(desktop || mobile);
      document.getElementById('headerSearchForm')?.requestSubmit();
      desktop?.focus();
    });

    bindSearchDebounce(
      document.getElementById('headerSearchInput'),
      document.getElementById('headerSearchForm'),
    );
    bindSearchDebounce(
      document.querySelector('[data-mobile-search-input]'),
      document.getElementById('headerSearchFormMobile'),
    );

    document.querySelector('[data-filter-sheet-grid]')?.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter-sheet-chip]');
      if (!chip) return;
      e.preventDefault();

      const slug = chip.dataset.category;
      if (filterSheetSelection.includes(slug)) {
        filterSheetSelection = filterSheetSelection.filter((c) => c !== slug);
      } else {
        filterSheetSelection.push(slug);
      }
      syncFilterSheetCheckboxes(filterSheetSelection);
    });
  }

  syncHeaderFromSwap();
}

window.closeFilterSheet = closeFilterSheet;

function initPriceSlider() {
  const track = document.querySelector('[data-price-track]');
  const inputMin = document.querySelector('[data-price-input-min]');
  const inputMax = document.querySelector('[data-price-input-max]');
  const range = document.querySelector('[data-price-range]');
  const minLabel = document.querySelector('[data-price-min-label]');
  const maxLabel = document.querySelector('[data-price-max-label]');
  const applyBtn = document.querySelector('[data-price-apply]');

  if (!track || !inputMin || !inputMax || !range) return;

  const min = parseInt(inputMin.min, 10);
  const max = parseInt(inputMin.max, 10);

  function updateRange() {
    const valMin = parseInt(inputMin.value, 10);
    const valMax = parseInt(inputMax.value, 10);
    const percentMin = ((valMin - min) / (max - min)) * 100;
    const percentMax = ((valMax - min) / (max - min)) * 100;

    range.style.left = percentMin + '%';
    range.style.width = (percentMax - percentMin) + '%';

    if (minLabel) minLabel.textContent = valMin;
    if (maxLabel) maxLabel.textContent = valMax;
  }

  function clampValues() {
    let valMin = parseInt(inputMin.value, 10);
    let valMax = parseInt(inputMax.value, 10);
    if (valMin > valMax - 1) {
      valMin = valMax - 1;
      inputMin.value = valMin;
    }
    if (valMax < valMin + 1) {
      valMax = valMin + 1;
      inputMax.value = valMax;
    }
  }

  inputMin.addEventListener('input', () => {
    clampValues();
    updateRange();
  });

  inputMax.addEventListener('input', () => {
    clampValues();
    updateRange();
  });

  if (applyBtn) {
    applyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const valMin = parseInt(inputMin.value, 10);
      const valMax = parseInt(inputMax.value, 10);
      const url = new URL(window.location.href);

      if (valMin > min) {
        url.searchParams.set('preco_min', valMin);
      } else {
        url.searchParams.delete('preco_min');
      }
      if (valMax < max) {
        url.searchParams.set('preco_max', valMax);
      } else {
        url.searchParams.delete('preco_max');
      }

      const hxGet = applyBtn.getAttribute('hx-get');
      applyBtn.setAttribute('hx-get', url.pathname + url.search);
      applyBtn.click();
    });
  }

  updateRange();
}

document.addEventListener('DOMContentLoaded', initPriceSlider);
document.addEventListener('htmx:afterSwap', initPriceSlider);
