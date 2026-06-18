import Swiper from 'swiper';
import { Pagination, Autoplay } from 'swiper/modules';

let announcementShownThisLoad = false;
let announcementSwiper = null;
let announcementListenersBound = false;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAnnouncementSlide(ad) {
  const title = escapeHtml(ad.title);
  const hasImage = Boolean(ad.image_url);

  if (hasImage) {
    return `
      <div class="swiper-slide">
        <article class="announcement-slide has-image">
          <img src="${escapeHtml(ad.image_url)}" alt="" class="announcement-slide-bg">
          <div class="announcement-slide-content">
            <h3>${title}</h3>
            ${ad.content_html ? `<div class="announcement-body">${ad.content_html}</div>` : ''}
          </div>
        </article>
      </div>
    `;
  }

  return `
    <div class="swiper-slide">
      <article class="announcement-slide">
        <h3>${title}</h3>
        ${ad.content_html ? `<div class="announcement-body">${ad.content_html}</div>` : ''}
      </article>
    </div>
  `;
}

function closeAnnouncementModal() {
  const overlay = document.getElementById('announcementOverlay');
  if (!overlay) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (announcementSwiper) {
    announcementSwiper.destroy(true, true);
    announcementSwiper = null;
  }
}

function openAnnouncementModal(announcements) {
  const overlay = document.getElementById('announcementOverlay');
  const body = document.getElementById('announcementModalBody');
  if (!overlay || !body || announcements.length === 0) return;

  const slides = announcements.map(renderAnnouncementSlide).join('');
  const multiple = announcements.length > 1;

  body.innerHTML = `
    <div class="announcement-modal-swiper swiper" data-announcement-modal-swiper>
      <div class="swiper-wrapper">${slides}</div>
      ${multiple ? '<div class="swiper-pagination"></div>' : ''}
    </div>
  `;

  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  if (multiple) {
    const el = body.querySelector('[data-announcement-modal-swiper]');
    announcementSwiper = new Swiper(el, {
      modules: [Pagination, Autoplay],
      loop: true,
      autoplay: { delay: 6000, disableOnInteraction: false },
      pagination: { el: el.querySelector('.swiper-pagination'), clickable: true },
    });
  }
}

export async function initAnnouncementModal() {
  if (announcementShownThisLoad) return;

  const overlay = document.getElementById('announcementOverlay');
  if (!overlay) return;

  if (!announcementListenersBound) {
    announcementListenersBound = true;
    document.getElementById('announcementCloseBtn')?.addEventListener('click', closeAnnouncementModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAnnouncementModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeAnnouncementModal();
      }
    });
  }

  try {
    const res = await fetch('/api/announcements');
    const data = await res.json();
    if (!data?.ok || !data.announcements?.length) return;

    announcementShownThisLoad = true;
    openAnnouncementModal(data.announcements);
  } catch {
    /* silencioso */
  }
}
