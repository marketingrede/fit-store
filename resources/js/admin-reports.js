const FORMAT_LABELS = {
  csv: 'CSV',
  ods: 'ODS',
  json: 'JSON',
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function selectedDatasetInput(form) {
  return form.querySelector('[data-report-dataset]:checked');
}

function selectedFormatInput(form) {
  return form.querySelector('[data-report-format]:checked');
}

function syncDatasetCards(form, datasetKey) {
  form.querySelectorAll('[data-report-dataset-card]').forEach((card) => {
    const input = card.querySelector('[data-report-dataset]');
    const selected = input?.value === datasetKey;
    card.classList.toggle('is-selected', Boolean(selected));
  });

  form.closest('[data-reports-page]')?.querySelectorAll('[data-report-pick]').forEach((button) => {
    const active = button.dataset.reportPick === datasetKey;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function updatePreview(form) {
  const datasetInput = selectedDatasetInput(form);
  const formatInput = selectedFormatInput(form);
  if (!datasetInput) return;

  const page = form.closest('[data-reports-page]');
  const datesFieldset = form.querySelector('[data-report-dates]');
  const supportsDates = datasetInput.dataset.supportsDates === '1';

  if (datesFieldset) {
    datesFieldset.hidden = !supportsDates;
    datesFieldset.classList.toggle('is-disabled', !supportsDates);
    datesFieldset.querySelectorAll('input').forEach((input) => {
      input.disabled = !supportsDates;
    });
  }

  syncDatasetCards(form, datasetInput.value);

  const label = page?.querySelector('[data-report-preview-label]');
  const count = page?.querySelector('[data-report-preview-count]');
  const fields = page?.querySelector('[data-report-preview-fields]');
  const format = page?.querySelector('[data-report-preview-format]');
  const filename = page?.querySelector('[data-report-filename]');

  if (label) label.textContent = datasetInput.dataset.label || '';
  if (count) count.textContent = datasetInput.dataset.previewCount || '0';
  if (fields) fields.textContent = datasetInput.dataset.fields || '';
  if (format) format.textContent = FORMAT_LABELS[formatInput?.value || 'csv'] || 'CSV';
  if (filename) {
    filename.textContent = `movimenta-${datasetInput.value}-${todayIso()}.${formatInput?.value || 'csv'}`;
  }
}

export function initAdminReports() {
  const form = document.querySelector('[data-reports-form]');
  if (!form) return;

  const refresh = () => updatePreview(form);

  form.querySelectorAll('[data-report-dataset]').forEach((input) => {
    input.addEventListener('change', refresh);
  });

  form.querySelectorAll('[data-report-format]').forEach((input) => {
    input.addEventListener('change', refresh);
  });

  form.closest('[data-reports-page]')?.querySelectorAll('[data-report-pick]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.reportPick;
      const target = form.querySelector(`[data-report-dataset][value="${key}"]`);
      if (!target) return;
      target.checked = true;
      refresh();
    });
  });

  refresh();
}
