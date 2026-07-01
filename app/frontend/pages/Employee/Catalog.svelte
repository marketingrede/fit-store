<script>
  import { router } from "@inertiajs/svelte"
  import EmployeeAreaLayout from "../../components/EmployeeAreaLayout.svelte"
  import ProductCard from "../../components/ProductCard.svelte"
  import TradeModal from "../../components/TradeModal.svelte"
  import { submitRedemption } from "../../lib/store-redemption.js"

  let {
    products = [],
    categories = [],
    filters = {},
    balanceFitc = 0,
  } = $props()

  let search = $state("")
  let selectedProduct = $state(null)
  let modalOpen = $state(false)

  $effect(() => {
    search = filters.q || ""
  })

  const categoryLabels = $derived(
    Object.fromEntries(categories.map((category) => [category.slug, category.label])),
  )

  function applySearch() {
    router.get("/colaborador/catalogo", { q: search }, { preserveState: true })
  }

  function openProduct(product) {
    selectedProduct = product
    modalOpen = true
  }
</script>

<svelte:head>
  <title>Catálogo | Colaborador Movimenta+</title>
</svelte:head>

<EmployeeAreaLayout active="catalog" {balanceFitc}>
  <div class="employee-card">
    <div class="employee-card__header-row">
      <h1 class="employee-card__title">Catálogo de resgates</h1>
      <span class="employee-card__pill">{balanceFitc} FITC</span>
    </div>

    <form
      class="employee-search"
      onsubmit={(event) => {
        event.preventDefault()
        applySearch()
      }}
    >
      <input
        type="search"
        bind:value={search}
        placeholder="Buscar produtos..."
        aria-label="Buscar produtos"
        class="employee-search__input"
      />
    </form>

    {#if products.length === 0}
      <p class="employee-empty">Nenhum produto disponível com seu saldo atual.</p>
    {:else}
      <div class="products-grid products-grid--employee">
        {#each products as product (product.id)}
          <ProductCard
            {product}
            categoryLabel={categoryLabels[product.category] || product.category}
            onSelect={openProduct}
          />
        {/each}
      </div>
    {/if}
  </div>
</EmployeeAreaLayout>

<TradeModal
  product={selectedProduct}
  products={products}
  {categoryLabels}
  open={modalOpen}
  employeeMode={true}
  {balanceFitc}
  onClose={() => {
    modalOpen = false
    selectedProduct = null
  }}
  onConfirm={submitRedemption}
/>
