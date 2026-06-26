<script>
  import { Link } from "@inertiajs/svelte"

  let { product, categoryLabel = "", onSelect = null } = $props()
</script>

{#if onSelect}
  <button
    type="button"
    class="group w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-teal hover:shadow-md"
    onclick={() => onSelect(product)}
  >
    <div class="aspect-square overflow-hidden bg-slate-100">
      <img
        src={product.image_url}
        alt={product.name}
        class="h-full w-full object-cover transition group-hover:scale-105"
        loading="lazy"
      />
    </div>
    <div class="p-3">
      <h3 class="truncate text-sm font-semibold text-slate-900">{product.name}</h3>
      <p class="mt-1 text-sm font-bold text-teal">
        {product.price_fitc}
        <span class="text-xs font-normal text-slate-500">FITC</span>
      </p>
      {#if categoryLabel}
        <p class="mt-1 truncate text-xs text-slate-400">{categoryLabel}</p>
      {/if}
    </div>
  </button>
{:else}
  <Link
    href={`/produtos/${product.id}`}
    class="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-teal hover:shadow-md"
  >
    <div class="aspect-square overflow-hidden bg-slate-100">
      <img
        src={product.image_url}
        alt={product.name}
        class="h-full w-full object-cover transition group-hover:scale-105"
        loading="lazy"
      />
    </div>
    <div class="p-3">
      <h3 class="truncate text-sm font-semibold text-slate-900">{product.name}</h3>
      <p class="mt-1 text-sm font-bold text-teal">
        {product.price_fitc}
        <span class="text-xs font-normal text-slate-500">FITC</span>
      </p>
      {#if categoryLabel}
        <p class="mt-1 truncate text-xs text-slate-400">{categoryLabel}</p>
      {/if}
    </div>
  </Link>
{/if}
