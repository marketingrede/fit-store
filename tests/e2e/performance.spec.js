import { test, expect } from '@playwright/test';
import {
  gotoHome,
  dismissAnnouncementIfVisible,
  openProductModalFromCard,
} from './helpers.js';

const THRESHOLDS = {
  homeLcpMs: 3500,
  modalOpenMs: 1200,
  modalExpandMs: 900,
  appJsGzipKb: 80,
  appJsRawKb: 320,
};

test.describe('Performance — catálogo e modal', () => {
  test('home carrega em tempo aceitável', async ({ page }) => {
    const started = Date.now();
    await gotoHome(page);
    await page.waitForSelector('[data-product-open]');
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(THRESHOLDS.homeLcpMs);
  });

  test('abertura do modal dentro do orçamento', async ({ page }) => {
    await gotoHome(page);
    await dismissAnnouncementIfVisible(page);

    const started = Date.now();
    await openProductModalFromCard(page, 0);
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(THRESHOLDS.modalOpenMs);
  });

  test('expansão da imagem responde rapidamente', async ({ page }) => {
    await gotoHome(page);
    await dismissAnnouncementIfVisible(page);
    await openProductModalFromCard(page, 0);

    const mediaBtn = page.locator('.swiper-slide-active [data-image-focus]');
    const started = Date.now();
    await mediaBtn.click();
    await expect(page.locator('.swiper-slide-active .product-modal-card')).toHaveClass(/is-media-expanded/);
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(THRESHOLDS.modalExpandMs);
  });

  test('bundle principal permanece dentro do limite de tamanho', async ({ request }) => {
    const manifestRes = await request.get('/assets/manifest.json');
    expect(manifestRes.ok()).toBeTruthy();

    const manifest = await manifestRes.json();
    const appEntry = manifest['resources/js/app.js']?.file;
    expect(appEntry).toBeTruthy();

    const jsRes = await request.get(`/assets/${appEntry}`);
    expect(jsRes.ok()).toBeTruthy();

    const buffer = await jsRes.body();
    const sizeKb = buffer.length / 1024;
    expect(sizeKb).toBeLessThan(THRESHOLDS.appJsRawKb);
  });
});
