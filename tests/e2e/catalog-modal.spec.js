import { test, expect } from '@playwright/test';
import {
  gotoHome,
  dismissAnnouncementIfVisible,
  openProductModalFromCard,
  closeProductModal,
} from './helpers.js';

test.describe('Modal de produto — interface', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
    await dismissAnnouncementIfVisible(page);
  });

  test('abre ao clicar no card e exibe conteúdo do produto', async ({ page }) => {
    await openProductModalFromCard(page, 0);

    await expect(page.locator('#productModalActiveTitle, .swiper-slide-active .product-modal-card__title').first()).toBeVisible();
    await expect(page.locator('.swiper-slide-active [data-open-trade]')).toBeVisible();
    await expect(page.locator('.swiper-slide-active .product-modal-card__price')).toContainText('FITC');
  });

  test('fecha pelo botão X e restaura o catálogo', async ({ page }) => {
    await openProductModalFromCard(page, 0);
    await closeProductModal(page);

    await expect(page.locator('[data-products-grid]')).toBeVisible();
    await expect(page.locator('[data-product-open]').first()).toBeVisible();
  });

  test('deep link /produto/{id} abre o modal', async ({ page }) => {
    await page.goto('/produto/1');
    await page.waitForSelector('[data-page="home"]');
    await dismissAnnouncementIfVisible(page);

    await expect(page.locator('#productModalDialog')).toHaveAttribute('aria-modal', 'true');
    await expect(page).toHaveURL(/\/produto\/1$/);
  });

  test('expandir imagem alterna aria-pressed e classe is-media-expanded', async ({ page }) => {
    await openProductModalFromCard(page, 0);

    const mediaBtn = page.locator('.swiper-slide-active [data-image-focus]');
    await expect(mediaBtn).toHaveAttribute('aria-pressed', 'false');

    await mediaBtn.click();
    await expect(mediaBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.swiper-slide-active .product-modal-card')).toHaveClass(/is-media-expanded/);
    await expect(mediaBtn).toHaveAttribute('aria-label', /Recolher/i);

    await mediaBtn.click();
    await expect(mediaBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.swiper-slide-active .product-modal-card')).not.toHaveClass(/is-media-expanded/);
  });
});

test.describe('Modal de produto — desktop', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
    await dismissAnnouncementIfVisible(page);
  });

  test('exibe setas de navegação fora do card', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Apenas desktop');

    await openProductModalFromCard(page, 0);

    await expect(page.locator('#productModalPrev')).toBeVisible();
    await expect(page.locator('#productModalNext')).toBeVisible();

    const prevBox = await page.locator('#productModalPrev').boundingBox();
    const cardBox = await page.locator('.modal--product').boundingBox();
    expect(prevBox).toBeTruthy();
    expect(cardBox).toBeTruthy();
    expect(prevBox.x + prevBox.width).toBeLessThanOrEqual(cardBox.x + 2);
  });

  test('seta próxima troca o produto na URL', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Apenas desktop');

    await openProductModalFromCard(page, 0);
    const firstUrl = page.url();

    await page.locator('#productModalNext').click();
    await page.waitForTimeout(400);

    const secondUrl = page.url();
    expect(secondUrl).toMatch(/\/produto\/\d+$/);
    expect(secondUrl).not.toBe(firstUrl);
  });
});

test.describe('Modal de produto — mobile', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
    await dismissAnnouncementIfVisible(page);
  });

  test('card flutuante não ocupa a tela inteira', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-pixel', 'Apenas mobile');

    await openProductModalFromCard(page, 0);

    const viewport = page.viewportSize();
    const cardBox = await page.locator('.modal--product').boundingBox();
    expect(viewport).toBeTruthy();
    expect(cardBox).toBeTruthy();
    expect(cardBox.height).toBeLessThan(viewport.height * 0.92);
    expect(cardBox.width).toBeLessThan(viewport.width);
  });

  test('oculta setas e mostra dica de swipe', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-pixel', 'Apenas mobile');

    await openProductModalFromCard(page, 0);

    await expect(page.locator('#productModalPrev')).toBeHidden();
    await expect(page.locator('#productModalNext')).toBeHidden();
    await expect(page.locator('#productModalSwipeHint')).toBeVisible();
    await expect(page.locator('#productModalSwipeHint')).toContainText(/deslize/i);
  });

  test('catálogo permanece perceptível ao fundo (backdrop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-pixel', 'Apenas mobile');

    await openProductModalFromCard(page, 0);

    await expect(page.locator('.product-modal-backdrop')).toBeVisible();
    await expect(page.locator('[data-products-grid]')).toBeAttached();
  });
});
