import { test, expect } from '@playwright/test';
import {
  gotoHome,
  dismissAnnouncementIfVisible,
  openProductModalFromCard,
  getSearchInput,
} from './helpers.js';

test.describe('Usabilidade — filtros e busca', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
    await dismissAnnouncementIfVisible(page);
  });

  test('filtro por categoria atualiza URL e contagem', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Chips desktop');

    const chip = page.locator('[data-filter-chip][data-category="proteinas"]');
    await chip.click();

    await expect(page).toHaveURL(/categorias=proteinas/);
    await expect(page.locator('[data-catalog-count]')).toContainText(/produto/);
    await expect(page.locator('[data-filter-chip].active[data-category="proteinas"]')).toBeVisible();
  });

  test('busca debounce atualiza resultados', async ({ page }) => {
    const input = await getSearchInput(page);
    await input.fill('whey');
    await page.waitForTimeout(400);

    await expect(page).toHaveURL(/[?&]q=whey/);
    await expect(page.locator('[data-catalog-count]')).toBeVisible();
  });

  test('limpar filtros restaura catálogo completo', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Chips desktop');

    await page.locator('[data-filter-chip][data-category="equipamentos"]').click();
    await expect(page).toHaveURL(/categorias=equipamentos/);

    await page.locator('[data-filter-chip][data-category="all"]').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('[data-filter-chip].active[data-category="all"]')).toBeVisible();
  });
});
