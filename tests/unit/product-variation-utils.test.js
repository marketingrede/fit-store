import { describe, it, expect } from 'vitest';
import {
  resolveProductPresentation,
  resolvePresentationForCard,
  validateSelections,
  formatSelectionSummary,
  getDefaultSelections,
} from '../../resources/js/product-variation-utils.js';

const sampleProduct = {
  id: 1,
  name: 'Whey',
  price_fitc: 150,
  image_url: '/base.jpg',
  variations: [
    {
      id: 10,
      name: 'Volume',
      unit: 'ml',
      required: true,
      allow_option_image: true,
      options: [
        { id: 101, label: '250', image_url: '/250.jpg', price_fitc_override: null },
        { id: 102, label: '500', image_url: '/500.jpg', price_fitc_override: 180 },
      ],
    },
    {
      id: 11,
      name: 'Sabor',
      required: false,
      allow_option_image: false,
      options: [{ id: 201, label: 'Chocolate' }],
    },
  ],
};

describe('product-variation-utils', () => {
  it('resolveProductPresentation aplica imagem e preço da opção', () => {
    const result = resolveProductPresentation(sampleProduct, { 10: '102', 11: '201' });
    expect(result.image_url).toBe('/500.jpg');
    expect(result.price_fitc).toBe(180);
  });

  it('resolveProductPresentation aplica imagem da opção mesmo sem flag do atributo', () => {
    const product = {
      ...sampleProduct,
      variations: [
        {
          id: 12,
          name: 'Modelo',
          required: true,
          allow_option_image: false,
          options: [{ id: 301, label: 'UV', image_url: '/uv.jpg' }],
        },
      ],
    };

    expect(resolveProductPresentation(product, { 12: '301' }).image_url).toBe('/uv.jpg');
  });

  it('validateSelections exige atributos obrigatórios', () => {
    expect(validateSelections(sampleProduct, {}).ok).toBe(false);
    expect(validateSelections(sampleProduct, { 10: '101' }).ok).toBe(true);
  });

  it('formatSelectionSummary monta texto legível', () => {
    const lines = formatSelectionSummary(sampleProduct, { 10: '101', 11: '201' });
    expect(lines).toContain('Volume: 250 ml');
    expect(lines).toContain('Sabor: Chocolate');
  });

  it('getDefaultSelections escolhe primeira opção', () => {
    expect(getDefaultSelections(sampleProduct)).toEqual({ 10: '101', 11: '201' });
  });

  it('resolvePresentationForCard usa data-option-image do input selecionado', () => {
    document.body.innerHTML = `
      <article data-product-card>
        <img data-product-image src="/base.jpg" alt="">
        <input type="radio" data-variation-input data-option-image="/dom.jpg" checked>
      </article>
    `;
    const card = document.querySelector('[data-product-card]');
    const presentation = resolvePresentationForCard(card, sampleProduct, { 10: '101' });
    expect(presentation.image_url).toBe('/dom.jpg');
  });
});
