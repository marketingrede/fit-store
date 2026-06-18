import { initAdminIcons } from './admin-icons.js';

function getSelectedRows(root) {
  return [...root.querySelectorAll('[data-bulk-row]:checked')];
}

function syncBulkBar(root) {
  const bar = root.querySelector('[data-bulk-bar]');
  const countEl = root.querySelector('[data-bulk-count]');
  const selectAll = root.querySelector('[data-bulk-select-all]');
  const rows = root.querySelectorAll('[data-bulk-row]');
  const selected = getSelectedRows(root);

  if (countEl) {
    const n = selected.length;
    countEl.textContent = n === 1 ? '1 selecionado' : `${n} selecionados`;
  }

  if (bar) {
    bar.hidden = selected.length === 0;
  }

  if (selectAll && rows.length) {
    selectAll.indeterminate = selected.length > 0 && selected.length < rows.length;
    selectAll.checked = selected.length === rows.length;
  }
}

function submitBulkDelete(root) {
  const selected = getSelectedRows(root);
  if (!selected.length) return;

  const count = selected.length;
  const message = count === 1
    ? 'Excluir permanentemente 1 produto selecionado? Esta ação não pode ser desfeita.'
    : `Excluir permanentemente ${count} produtos selecionados? Esta ação não pode ser desfeita.`;

  if (!window.confirm(message)) {
    return;
  }

  const deleteForm = document.getElementById('adminProductsBulkDeleteForm');
  const idsHost = deleteForm?.querySelector('[data-bulk-delete-ids]');
  if (!deleteForm || !idsHost) return;

  idsHost.innerHTML = '';
  selected.forEach((input) => {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'product_ids[]';
    hidden.value = input.value;
    idsHost.appendChild(hidden);
  });

  deleteForm.submit();
}

function bindBulkForm(root) {
  if (!root || root.dataset.bulkBound) return;
  root.dataset.bulkBound = '1';

  const form = document.getElementById('adminProductsBulkForm');
  const selectAll = root.querySelector('[data-bulk-select-all]');

  selectAll?.addEventListener('change', () => {
    const checked = selectAll.checked;
    root.querySelectorAll('[data-bulk-row]').forEach((input) => {
      input.checked = checked;
    });
    syncBulkBar(root);
  });

  root.addEventListener('change', (e) => {
    if (e.target.matches('[data-bulk-row]')) {
      syncBulkBar(root);
    }
  });

  form?.addEventListener('submit', (e) => {
    const selected = getSelectedRows(root);
    if (!selected.length) {
      e.preventDefault();
      return;
    }

    const category = form.querySelector('[name="bulk_category"]')?.value;
    const tag = form.querySelector('[name="bulk_tag"]')?.value;
    const willChange = (category && category !== '__keep__') || (tag && tag !== '__keep__');

    if (!willChange) {
      e.preventDefault();
      window.alert('Escolha categoria e/ou tag para aplicar nos produtos selecionados.');
      return;
    }

    const count = selected.length;
    const label = count === 1 ? '1 produto' : `${count} produtos`;
    if (!window.confirm(`Aplicar as alterações em ${label}?`)) {
      e.preventDefault();
    }
  });

  root.querySelector('[data-bulk-delete]')?.addEventListener('click', () => {
    submitBulkDelete(root);
  });

  syncBulkBar(root);
  initAdminIcons(root);
}

export function initAdminProductsBulk(root = document.getElementById('admin-products-list')) {
  bindBulkForm(root);
}
