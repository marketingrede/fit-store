<script>
  import { router } from "@inertiajs/svelte"
  import ProductCard from "../../components/ProductCard.svelte"
  import TradeModal from "../../components/TradeModal.svelte"

  let { products = [], categories = [], tags = [], filters = {}, pagination = {} } = $props()

  let search = $state("")
  let selectedCategory = $state("")
  let selectedProduct = $state(null)
  let modalOpen = $state(false)

  $effect(() => {
    search = filters.q || ""
    selectedCategory = filters.category || ""
  })

  const categoryLabels = $derived(
    Object.fromEntries(categories.map((category) => [category.slug, category.label])),
  )

  function applyFilters() {
    router.get(
      "/",
      { q: search, category: selectedCategory, page: 1 },
      { preserveState: true, preserveScroll: true },
    )
  }

  function openProduct(product) {
    selectedProduct = product
    modalOpen = true
  }

  function closeModal() {
    modalOpen = false
    selectedProduct = null
  }

  function goToPage(page) {
    router.get("/", { q: search, category: selectedCategory, page }, { preserveState: true })
  }
</script>

<svelte:head>
  <title>Catálogo | Movimenta+ Fit Store</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-teal">Movimenta+</p>
        <h1 class="text-xl font-bold text-slate-900">Catálogo Fit Store</h1>
      </div>
      <a href="/colaborador/login" class="text-sm font-medium text-slate-600 hover:text-teal">
        Área do colaborador
      </a>
    </div>
  </header>

  <main class="mx-auto max-w-6xl px-4 py-8">
    <form
      class="mb-6 flex flex-col gap-3 sm:flex-row"
      onsubmit={(event) => {
        event.preventDefault()
        applyFilters()
      }}
    >
      <input
        type="search"
        bind:value={search}
        placeholder="Buscar produtos..."
        class="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
        aria-label="Buscar produtos"
      />
      <select
        bind:value={selectedCategory}
        class="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal"
        aria-label="Filtrar por categoria"
      >
        <option value="">Todas as categorias</option>
        {#each categories as category (category.slug)}
          <option value={category.slug}>{category.label}</option>
        {/each}
      </select>
      <button
        type="submit"
        class="rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark"
      >
        Buscar
      </button>
    </form>

    {#if tags.length}
      <div class="mb-6 flex flex-wrap gap-2">
        {#each tags as tag (tag.name)}
          <span
            class="rounded-full px-3 py-1 text-xs font-medium text-white"
            style={`background-color: ${tag.color || "#6b7280"}`}
          >
            {tag.name}
          </span>
        {/each}
      </div>
    {/if}

    {#if products.length === 0}
      <div class="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
        <p class="text-slate-500">Nenhum produto encontrado.</p>
      </div>
    {:else}
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {#each products as product (product.id)}
          <ProductCard
            {product}
            categoryLabel={categoryLabels[product.category] || product.category}
            onSelect={openProduct}
          />
        {/each}
      </div>
    {/if}

    {#if pagination.pages > 1}
      <nav class="mt-8 flex items-center justify-center gap-3" aria-label="Paginação">
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
          disabled={!pagination.prev}
          onclick={() => goToPage(pagination.page - 1)}
        >
          Anterior
        </button>
        <span class="text-sm text-slate-600">
          Página {pagination.page} de {pagination.pages}
        </span>
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
          disabled={!pagination.next}
          onclick={() => goToPage(pagination.page + 1)}
        >
          Próxima
        </button>
      </nav>
    {/if}
  </main>
</div>

<TradeModal product={selectedProduct} open={modalOpen} onClose={closeModal} />
