import '../css/app.css';

import NProgress from 'nprogress';
import { initHtmxApp } from './htmx-setup.js';

NProgress.configure({ showSpinner: false });
window.NProgress = NProgress;

document.addEventListener('htmx:beforeRequest', (e) => {
  if (!document.getElementById('spa-outlet')) return;
  if (e.detail.elt?.closest('#spa-outlet, .topbar, .filter-sheet, .filter-sheet-backdrop')) {
    NProgress.start();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initHtmxApp();
});
