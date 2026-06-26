<script>
  import { Link } from "@inertiajs/svelte"
  import TradeModal from "../../components/TradeModal.svelte"
  import {
    getDefaultSelections,
    resolveProductPresentation,
  } from "../../lib/product-variations.js"

  let { product, categoryLabel = "" } = $props()

  let selections = $state({})
  let modalOpen = $state(false)

  $effect(() => {
    selections = getDefaultSelections(product)
  })

  let presentation = $derived(resolveProductPresentation(product, selections))

  function chooseOption(attributeId, optionId) {
    selections = { ...selections, [String(attributeId)]: String(optionId) }
  }
</script>

<svelte:head>
  <title>{product.name} | Movimenta+ Fit Store</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
      <Link href="/" class="text-sm font-medium text-teal hover:underline">&larr; Voltar ao catálogo</Link>
    </div>
  </header>

  <main class="mx-auto grid max-w-4xl gap-8 px-4 py-8 lg:grid-cols-2">
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
      {#if presentation.image_url}
        <img src={presentation.image_url} alt={product.name} class="aspect-square w-full object-cover" />
      {:else}
        <div class="flex aspect-square items-center justify-center bg-slate-100 text-slate-400">
          Sem imagem
        </div>
      {/if}
    </div>

    <div>
      {#if categoryLabel}
        <p class="text-xs font-semibold uppercase tracking-wide text-teal">{categoryLabel}</p>
      {/if}
      <h1 class="mt-1 text-2xl font-bold text-slate-900">{product.name}</h1>

      {#if product.tag}
        <span class="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
          {product.tag}
        </span>
      {/if}

      <p class="mt-4 text-3xl font-bold text-teal">
        {presentation.price_fitc}
        <span class="text-base font-normal text-slate-500">FITC</span>
      </p>

      {#if product.description}
        <p class="mt-4 text-sm leading-relaxed text-slate-600">{product.description}</p>
      {/if}

      {#each product.variations || [] as attr (attr.id)}
        <fieldset class="mt-6">
          <legend class="mb-2 text-sm font-semibold text-slate-800">
            {attr.name}
            {#if attr.unit}
              <span class="font-normal text-slate-500">({attr.unit})</span>
            {/if}
          </legend>
          <div class="flex flex-wrap gap-2">
            {#each attr.options || [] as option (option.id)}
              <label class="cursor-pointer">
                <input
                  type="radio"
                  class="peer sr-only"
                  name={`variation-${attr.id}`}
                  checked={selections[String(attr.id)] === String(option.id)}
                  onchange={() => chooseOption(attr.id, option.id)}
                />
                <span
                  class="inline-block rounded-lg border border-slate-200 px-3 py-1.5 text-sm peer-checked:border-teal peer-checked:bg-teal/10"
                >
                  {option.label}
                </span>
              </label>
            {/each}
          </div>
        </fieldset>
      {/each}

      <button
        type="button"
        class="mt-8 w-full rounded-lg bg-teal px-4 py-3 text-sm font-semibold text-white hover:bg-teal-dark"
        onclick={() => (modalOpen = true)}
      >
        Solicitar resgate
      </button>
    </div>
  </main>
</div>

<TradeModal product={product} open={modalOpen} onClose={() => (modalOpen = false)} />
