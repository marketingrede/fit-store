import '../css/brand.css';
import '../css/admin.css';
import 'quill/dist/quill.snow.css';
import 'cropperjs/dist/cropper.css';

import Quill from 'quill';
import Cropper from 'cropperjs';
import { initAdminProducts } from './admin-products.js';
import { initAdminProductsBulk } from './admin-products-bulk.js';
import { initAdminShell } from './admin-shell.js';
import { initHtmxAdmin } from './htmx-setup.js';
import { initAdminIcons } from './admin-icons.js';
import { initAdminCtaEditor } from './admin-cta-editor.js';
import { initAdminSettings } from './admin-settings.js';
import { initAdminDashboard } from './admin-dashboard.js';
import { initAdminReports } from './admin-reports.js';

document.addEventListener('DOMContentLoaded', () => {
  initHtmxAdmin();
  initAdminShell();
  initAdminIcons();
  initAdminDashboard();
  initAdminReports();
  initAdminProducts();
  initAdminProductsBulk();
  initAdminCtaEditor();
  initAdminSettings();

  const form = document.getElementById('announcementForm');
  const editorEl = document.getElementById('editor');
  const contentInput = document.getElementById('contentHtmlInput');
  const imageInput = document.getElementById('imageInput');
  const cropPreview = document.getElementById('cropPreview');
  const cropWrap = document.getElementById('cropPreviewWrap');
  const cropDataInput = document.getElementById('cropDataInput');

  if (!form || !editorEl) return;

  const quill = new Quill(editorEl, {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ header: [2, 3, false] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
      ],
    },
  });

  let cropper = null;

  imageInput?.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      cropPreview.src = reader.result;
      cropWrap.style.display = 'block';

      if (cropper) cropper.destroy();
      cropper = new Cropper(cropPreview, {
        aspectRatio: 16 / 9,
        viewMode: 1,
        autoCropArea: 1,
        crop(event) {
          cropDataInput.value = JSON.stringify(event.detail);
        },
      });
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', (e) => {
    contentInput.value = quill.root.innerHTML;

    if (cropper) {
      const canvas = cropper.getCroppedCanvas({ width: 1200, imageSmoothingQuality: 'high' });
      if (canvas) {
        e.preventDefault();
        canvas.toBlob((blob) => {
          if (!blob) {
            form.submit();
            return;
          }
          const dt = new DataTransfer();
          const cropped = new File([blob], 'announcement.jpg', { type: 'image/jpeg' });
          if (imageInput.files?.[0]) {
            dt.items.add(cropped);
            imageInput.files = dt.files;
          }
          form.submit();
        }, 'image/jpeg', 0.9);
      }
    }
  });
});
