<script>
  import { Link, router } from "@inertiajs/svelte"
  import ProductCard from "../../components/ProductCard.svelte"
  import TradeModal from "../../components/TradeModal.svelte"

  let {
    products = [],
    categories = [],
    filters = {},
    balanceFitc = 0,
    employee = {},
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

<div class="min-h-screen bg-slate-50">
  <nav class="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3">
    <div class="mx-auto flex max-w-4xl items-center justify-between">
      <span class="text-sm font-semibold text-slate-900">Colaborador</span>
      <div class="flex items-center gap-4 text-sm">
        <Link href="/colaborador/perfil" class="text-slate-600 hover:text-teal">Perfil</Link>
        <Link href="/colaborador/extrato" class="text-slate-600 hover:text-teal">Extrato</Link>
        <Link href="/colaborador/resgates" class="text-slate-600 hover:text-teal">Resgates</Link>
        <Link href="/colaborador/catalogo" class="font-medium text-teal">Catálogo</Link>
      </div>
    </div>
  </nav>

  <main class="mx-auto max-w-4xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-slate-900">Catálogo de resgates</h1>
      <span class="rounded-lg bg-teal px-3 py-1.5 text-sm font-semibold text-white">
        Saldo: {balanceFitc} FITC
      </span>
    </div>

    <form
      class="mb-6"
      onsubmit={(event) => {
        event.preventDefault()
        applySearch()
      }}
    >
      <input
        type="search"
        bind:value={search}
        placeholder="Buscar produtos..."
        class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal"
      />
    </form>

    {#if products.length === 0}
      <p class="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-500">
        Nenhum produto disponível.
      </p>
    {:else}
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {#each products as product (product.id)}
          <ProductCard
            {product}
            categoryLabel={categoryLabels[product.category] || product.category}
            onSelect={openProduct}
          />
        {/each}
      </div>
    {/if}
  </main>
</div>

<TradeModal
  product={selectedProduct}
  open={modalOpen}
  employeeMode={true}
  {balanceFitc}
  onClose={() => {
    modalOpen = false
    selectedProduct = null
  }}
/>
