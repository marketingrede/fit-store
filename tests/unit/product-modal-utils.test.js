import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  renderProductSlideHtml,
  parseCatalogProductsJson,
  getGridConfig,
  isMobileViewport,
  DESKTOP_GRID,
  MOBILE_GRID,
} from '../../resources/js/product-modal-utils.js';
import { buildHomeUrl, getCategoriesFromUrl } from '../../resources/js/catalog-url.js';

describe('product-modal-utils', () => {
  it('escapeHtml neutraliza caracteres perigosos', () => {
    expect(escapeHtml('<script>"x"</script>')).toBe('&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
  });

  it('renderProductSlideHtml inclui controles de acessibilidade', () => {
    const html = renderProductSlideHtml(
      { id: 1, name: 'Whey', category: 'proteinas', price_fitc: 150, description: 'Teste', tag: 'Whey' },
      { proteinas: 'Proteínas' },
    );

    expect(html).toContain('data-image-focus');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('data-open-trade');
    expect(html).toContain('Ampliar');
    expect(html).toContain('Recolher');
    expect(html).toContain('Tag: Whey');
    expect(html).not.toContain('Categoria:');
  });

  it('parseCatalogProductsJson retorna array válido', () => {
    expect(parseCatalogProductsJson('[{"id":1}]')).toEqual([{ id: 1 }]);
    expect(parseCatalogProductsJson('invalid')).toEqual([]);
    expect(parseCatalogProductsJson('')).toEqual([]);
  });

  it('getGridConfig alterna desktop e mobile', () => {
    expect(getGridConfig(1200)).toEqual({ key: 'gridTemplateColumns', grids: DESKTOP_GRID });
    expect(getGridConfig(390)).toEqual({ key: 'gridTemplateRows', grids: MOBILE_GRID });
    expect(isMobileViewport(768)).toBe(true);
    expect(isMobileViewport(769)).toBe(false);
  });
});

describe('filters', () => {
  it('buildHomeUrl monta query de categorias OR', () => {
    const url = buildHomeUrl('whey', ['proteinas', 'equipamentos']);
    expect(url).toMatch(/^\/?\?q=whey&categorias=proteinas(%2C|,)equipamentos$/);
    expect(buildHomeUrl('', [])).toBe('/');
  });

  it('getCategoriesFromUrl lê categorias múltiplas e legado', () => {
    expect(getCategoriesFromUrl('http://localhost/?categorias=a,b')).toEqual(['a', 'b']);
    expect(getCategoriesFromUrl('http://localhost/?categoria=vestuario')).toEqual(['vestuario']);
    expect(getCategoriesFromUrl('http://localhost/')).toEqual([]);
  });
});
