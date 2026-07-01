<script>
  import { page } from "@inertiajs/svelte"
  import { Link } from "@inertiajs/svelte"
  import EmployeeLoginModal from "../../components/EmployeeLoginModal.svelte"
  import ProductPageChrome from "../../components/ProductPageChrome.svelte"
  import ProductCard from "../../components/ProductCard.svelte"
  import TradeModal from "../../components/TradeModal.svelte"
  import { submitRedemption } from "../../lib/store-redemption.js"
  import {
    getDefaultSelections,
    resolveProductPresentation,
  } from "../../lib/product-variations.js"

  let {
    product,
    related = [],
    category_label: categoryLabel = "",
    categories = [],
  } = $props()

  let selections = $state({})
  let modalOpen = $state(true)
  let loginModalOpen = $state(false)
  let loginModalError = $state("")

  let currentEmployee = $derived($page.props.auth?.employee ?? null)
  let balanceFitc = $derived(currentEmployee?.balance_fitc ?? null)
  let employeeMode = $derived(Boolean(currentEmployee))

  const categoryLabels = $derived(
    Object.fromEntries(categories.map((category) => [category.slug, category.label])),
  )

  $effect(() => {
    selections = getDefaultSelections(product)
  })

  $effect(() => {
    const alert = $page.props.flash?.alert
    if (!alert || !loginModalOpen) return
    loginModalError = alert
  })

  let presentation = $derived(resolveProductPresentation(product, selections))

  function openLoginModal() {
    loginModalError = ""
    loginModalOpen = true
  }

  function closeLoginModal() {
    loginModalOpen = false
    loginModalError = ""
  }

  function handleLoginSuccess() {
    loginModalError = ""
    closeLoginModal()
  }

  function handleLoginRequired() {
    openLoginModal()
  }

  function closeModal() {
    modalOpen = false
  }
</script>

<svelte:head>
  <title>{product.name} | Movimenta+ Fit Store</title>
</svelte:head>

<div class="fit-store-page">
  <ProductPageChrome
    {currentEmployee}
    {balanceFitc}
    onLogin={openLoginModal}
  />

  <main class="catalog-shell product-show">
    <div class="product-show__hero">
      <div class="product-show__media">
        {#if presentation?.image_url}
          <img src={presentation.image_url} alt={product.name} />
        {:else}
          <span class="product-image__fallback">Sem imagem</span>
        {/if}
      </div>

      <div class="product-show__summary">
        {#if categoryLabel}
          <p class="product-show__meta">{categoryLabel}</p>
        {/if}
        <h1 class="product-show__title">{product.name}</h1>
        <p class="product-show__price">
          {presentation?.price_fitc}
          <span>FITC</span>
        </p>
        {#if product.description}
          <p class="product-show__desc">{product.description}</p>
        {/if}
        <button type="button" class="redeem-button product-show__cta" onclick={() => (modalOpen = true)}>
          {employeeMode ? "Quero trocar meus Fitcoin" : "Entrar para resgatar"}
        </button>
      </div>
    </div>

    {#if related.length}
      <section class="product-show__related" aria-labelledby="related-title">
        <h2 id="related-title" class="product-show__related-title">Produtos relacionados</h2>
        <div class="products-grid">
          {#each related as item (item.id)}
            <ProductCard
              product={item}
              categoryLabel={categoryLabels[item.category] || item.category}
              onSelect={() => {
                window.location.href = `/produto/${item.id}`
              }}
            />
          {/each}
        </div>
      </section>
    {/if}
  </main>
</div>

<TradeModal
  {product}
  products={[product, ...related]}
  categoryLabels={categoryLabels}
  open={modalOpen}
  {employeeMode}
  {balanceFitc}
  onClose={closeModal}
  onConfirm={submitRedemption}
  onLoginRequired={handleLoginRequired}
/>

<EmployeeLoginModal
  open={loginModalOpen}
  error={loginModalError}
  returnTo={`/produto/${product.id}`}
  onClose={closeLoginModal}
  onSuccess={handleLoginSuccess}
/>
