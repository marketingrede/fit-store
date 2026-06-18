import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  gotoHome,
  dismissAnnouncementIfVisible,
  openProductModalFromCard,
  expectProductModalClosed,
} from './helpers.js';

test.describe('Acessibilidade — loja e modal', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
    await dismissAnnouncementIfVisible(page);
  });

  test('home sem violações críticas ou sérias', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const blocking = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
    expect(blocking, formatViolations(blocking)).toEqual([]);
  });

  test('modal aberto sem violações críticas ou sérias', async ({ page }) => {
    await openProductModalFromCard(page, 0);
    await page.waitForFunction(() => {
      const panel = document.querySelector('.modal--product');
      if (!panel) return false;
      return parseFloat(getComputedStyle(panel).opacity) >= 0.99;
    });

    const results = await new AxeBuilder({ page })
      .include('#productModalDialog')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const blocking = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
    expect(blocking, formatViolations(blocking)).toEqual([]);
  });

  test('modal usa aria-labelledby com título visível', async ({ page }) => {
    await openProductModalFromCard(page, 0);

    const dialog = page.locator('#productModalDialog');
    await expect(dialog).toHaveAttribute('aria-labelledby', 'productModalActiveTitle');
    await expect(page.locator('#productModalActiveTitle, .swiper-slide-active .product-modal-card__title').first()).toBeVisible();
  });

  test('botão de imagem expõe estado com aria-pressed', async ({ page }) => {
    await openProductModalFromCard(page, 0);

    const mediaBtn = page.locator('.swiper-slide-active [data-image-focus]');
    await expect(mediaBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(mediaBtn).toHaveAttribute('aria-label', /ampliar/i);

    await mediaBtn.click();
    await expect(mediaBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(mediaBtn).toHaveAttribute('aria-label', /recolher/i);
  });

  test('fechar modal devolve foco ao fluxo da página', async ({ page }) => {
    await openProductModalFromCard(page, 0);
    await page.locator('#productModalClose').click();
    await expectProductModalClosed(page);

    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});

function formatViolations(violations) {
  return violations
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.html).join(' | ')}`)
    .join('\n');
}
