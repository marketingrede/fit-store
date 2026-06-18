import { expect } from '@playwright/test';

export async function gotoHome(page) {
  await page.goto('/');
  await page.waitForSelector('[data-page="home"]');
}

export async function dismissAnnouncementIfVisible(page) {
  const overlay = page.locator('#announcementOverlay');
  const visible = await overlay.evaluate((el) => el.classList.contains('is-open')).catch(() => false);
  if (visible) {
    await page.locator('#announcementCloseBtn').click();
    await expect(overlay).not.toHaveClass(/is-open/);
  }
}

export function productModal(page) {
  return page.locator('#productModalDialog');
}

export async function expectProductModalOpen(page) {
  const dialog = productModal(page);
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog).not.toHaveAttribute('aria-hidden', 'true');
}

export async function expectProductModalClosed(page) {
  await expect(productModal(page)).toHaveAttribute('aria-hidden', 'true');
}

export async function getSearchInput(page) {
  const mobile = page.locator('[data-mobile-search-input]');
  if (await mobile.isVisible()) return mobile;
  return page.locator('#headerSearchInput');
}

export async function openProductModalFromCard(page, index = 0) {
  const card = page.locator('[data-product-open]').nth(index);
  await expect(card).toBeVisible();
  await card.click();
  await expectProductModalOpen(page);
  await page.locator('#productModalActiveTitle, .swiper-slide-active .product-modal-card__title').first().waitFor({ state: 'visible' });
}

export async function closeProductModal(page) {
  await page.locator('#productModalClose').click();
  await expectProductModalClosed(page);
}
