<script>
  import { Link } from "@inertiajs/svelte"

  let { product, categoryLabel = "", onSelect = null } = $props()

  const productHref = $derived(`/produtos/${product.id}`)
  const accessibleLabel = $derived(`Abrir detalhes de ${product.name}`)
</script>

{#if onSelect}
  <button
    type="button"
    class="product-card"
    aria-label={accessibleLabel}
    onclick={() => onSelect(product)}
  >
    <div class="product-image">
      {#if product.image_url}
        <img src={product.image_url} alt={product.name} loading="lazy" />
      {:else}
        <span class="product-image__fallback">Sem imagem</span>
      {/if}
    </div>
    <div class="product-card__body">
      <h3 class="product-title">{product.name}</h3>
      <p class="product-meta-line">
        <span class="product-price-text">{product.price_fitc} FITC</span>
        {#if categoryLabel}
          <span class="product-meta-sep" aria-hidden="true">&middot;</span>
          <span class="product-meta-category">{categoryLabel}</span>
        {/if}
      </p>
      {#if categoryLabel}
        <p class="sr-only">Categoria: {categoryLabel}</p>
      {/if}
    </div>
  </button>
{:else}
  <Link
    href={productHref}
    class="product-card"
    aria-label={accessibleLabel}
  >
    <div class="product-image">
      {#if product.image_url}
        <img src={product.image_url} alt={product.name} loading="lazy" />
      {:else}
        <span class="product-image__fallback">Sem imagem</span>
      {/if}
    </div>
    <div class="product-card__body">
      <h3 class="product-title">{product.name}</h3>
      <p class="product-meta-line">
        <span class="product-price-text">{product.price_fitc} FITC</span>
        {#if categoryLabel}
          <span class="product-meta-sep" aria-hidden="true">&middot;</span>
          <span class="product-meta-category">{categoryLabel}</span>
        {/if}
      </p>
      {#if categoryLabel}
        <p class="sr-only">Categoria: {categoryLabel}</p>
      {/if}
    </div>
  </Link>
{/if}
