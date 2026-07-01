<script>
  import autoAnimate from "@formkit/auto-animate"
  import { page, router } from "@inertiajs/svelte"
  import { onDestroy, tick } from "svelte"
  import CatalogFeatureCard from "../../components/CatalogFeatureCard.svelte"
  import EmployeeLoginModal from "../../components/EmployeeLoginModal.svelte"
  import ProductCard from "../../components/ProductCard.svelte"
  import TradeModal from "../../components/TradeModal.svelte"
  import { submitRedemption } from "../../lib/store-redemption.js"

  let {
    products = [],
    categories = [],
    tags = [],
    filters = {},
    pagination = {},
    cta_cards = [],
    price_bounds = { min: 0, max: 0 },
  } = $props()

  let search = $state("")
  let selectedCategories = $state([])
  let filterSheetCategories = $state([])
  let selectedTag = $state("")
  let selectedProduct = $state(null)
  let modalOpen = $state(false)
  let filterSheetOpen = $state(false)
  let filterSheetVisible = $state(false)
  let filterSheetClosing = $state(false)
  let isCatalogLoading = $state(false)
  let loadingLabel = $state("Atualizando produtos")
  let liveStatus = $state("")
  let liveProducts = $state(null)
  let livePagination = $state(null)
  let livePriceBounds = $state(null)
  let feedProducts = $state([])
  let feedPage = $state(1)
  let feedHasMore = $state(false)
  let infiniteLoading = $state(false)
  let scrollStatus = $state("")
  let scrollSentinel = $state(null)
  let priceMin = $state(0)
  let priceMax = $state(0)
  let desktopSearchInput = $state(null)
  let mobileSearchFloatInput = $state(null)
  let mobileSearchOpen = $state(false)
  let loginModalOpen = $state(false)
  let loginModalError = $state("")
  let filterTimer = null
  let feedSnapshotKey = $state("")

  let currentEmployee = $derived($page.props.auth?.employee ?? null)
  let balanceFitc = $derived(currentEmployee?.balance_fitc ?? null)
  let employeeMode = $derived(Boolean(currentEmployee))
  let employeeFirstName = $derived(currentEmployee?.full_name?.split(" ")?.[0] || "Conta")

  const liveFilterDelay = 280
  const liveSearchDelay = 360
  const livePriceDelay = 260

  let catalogProducts = $derived(feedProducts)
  let catalogPagination = $derived(livePagination ?? pagination)
  let catalogPriceBounds = $derived(livePriceBounds ?? price_bounds)
  let priceBounds = $derived({
    min: Number(catalogPriceBounds?.min || 0),
    max: Math.max(Number(catalogPriceBounds?.max || 0), Number(catalogPriceBounds?.min || 0)),
  })

  $effect(() => {
    const alert = $page.props.flash?.alert
    if (!alert || !loginModalOpen) return
    loginModalError = alert
  })

  $effect(() => {
    if (typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    if (params.get("login") !== "1") return

    loginModalOpen = true
    params.delete("login")
    const query = params.toString()
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`
    window.history.replaceState({}, "", nextUrl)
  })

  $effect(() => {
    const tagFilter = Array.isArray(filters.tags) ? filters.tags[0] : filters.tags
    const categoryFilters = Array.isArray(filters.categorias) ? filters.categorias : []

    search = filters.q || ""
    selectedCategories = categoryFilters.filter(Boolean)
    selectedTag = tagFilter || ""
    priceMin = Number(filters.price_min ?? priceBounds.min)
    priceMax = Number(filters.price_max ?? priceBounds.max)
  })

  $effect(() => {
    if (!filterSheetVisible || typeof document === "undefined") return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    requestAnimationFrame(() => {
      document.body.classList.add("filter-sheet-open")
    })

    return () => {
      document.body.classList.remove("filter-sheet-open")
      document.body.style.overflow = previousOverflow
    }
  })

  $effect(() => {
    const snapshotKey = serverFeedSnapshotKey()
    if (snapshotKey === feedSnapshotKey) return

    feedSnapshotKey = snapshotKey
    syncFeedFromServer(liveProducts ?? products, livePagination ?? pagination)

    if (liveProducts !== null) {
      liveProducts = null
      livePagination = null
    }
  })

  $effect(() => {
    if (!scrollSentinel || !feedHasMore || typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadNextFeedPage()
        }
      },
      { root: null, rootMargin: "240px 0px", threshold: 0 },
    )

    observer.observe(scrollSentinel)

    return () => {
      observer.disconnect()
    }
  })

  const categoryLabels = $derived(
    Object.fromEntries(categories.map((category) => [category.slug, category.label])),
  )
  const hasPriceFilter = $derived(
    priceBounds.max > priceBounds.min &&
      (Number(priceMin) > priceBounds.min || Number(priceMax) < priceBounds.max),
  )
  const ctaCardsBySlot = $derived(
    Object.fromEntries(cta_cards.map((card) => [Number(card.slot), card])),
  )
  const activeFilterCount = $derived(selectedCategories.length + (selectedTag ? 1 : 0))
  const hasActiveFilters = $derived(activeFilterCount > 0 || hasPriceFilter || Boolean(search.trim()))
  const productCount = $derived(Number(catalogPagination.total ?? catalogProducts.length))
  const productCountLabel = $derived(
    `${productCount} ${productCount === 1 ? "produto" : "produtos"}`,
  )

  onDestroy(() => {
    if (filterTimer) clearTimeout(filterTimer)
  })

  function serverFeedSnapshotKey() {
    const tagFilter = Array.isArray(filters.tags) ? filters.tags[0] : filters.tags
    const categoryFilters = Array.isArray(filters.categorias) ? filters.categorias : []

    return JSON.stringify({
      q: filters.q ?? "",
      categorias: categoryFilters.filter(Boolean).sort(),
      tags: tagFilter ?? "",
      price_min: filters.price_min ?? null,
      price_max: filters.price_max ?? null,
    })
  }

  function syncFeedFromServer(nextProducts, nextPagination) {
    feedProducts = [...nextProducts]
    feedPage = Number(nextPagination?.page ?? 1)
    feedHasMore = Boolean(nextPagination?.next)
    if (!feedHasMore) {
      scrollStatus = feedProducts.length ? "Todos os produtos foram carregados." : ""
    } else {
      scrollStatus = ""
    }
  }

  function buildApiQuery(page) {
    const params = paramsFor({ page })
    const query = new URLSearchParams()

    query.set("page", String(page))
    if (params.q) query.set("q", params.q)

    const categories = Array.isArray(params.categorias)
      ? params.categorias
      : params.categorias
        ? [params.categorias]
        : []
    categories.forEach((slug) => query.append("categorias", slug))

    const tagList = Array.isArray(params.tags) ? params.tags : params.tags ? [params.tags] : []
    tagList.forEach((tag) => query.append("tags", tag))

    if (params.price_min != null) query.set("price_min", String(params.price_min))
    if (params.price_max != null) query.set("price_max", String(params.price_max))

    return query.toString()
  }

  async function loadNextFeedPage() {
    if (infiniteLoading || !feedHasMore || isCatalogLoading) return

    infiniteLoading = true
    scrollStatus = "Carregando mais produtos…"

    const nextPage = feedPage + 1

    try {
      const response = await fetch(`/api/catalog/products?${buildApiQuery(nextPage)}`)
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.ok) {
        scrollStatus = data?.error || "Não foi possível carregar mais produtos."
        return
      }

      const existingIds = new Set(feedProducts.map((product) => product.id))
      const incoming = Array.isArray(data.products) ? data.products : []
      const freshProducts = incoming.filter((product) => !existingIds.has(product.id))

      feedProducts = [...feedProducts, ...freshProducts]
      feedPage = Number(data.page ?? nextPage)
      feedHasMore = Boolean(data.has_more)
      scrollStatus = feedHasMore ? "" : "Todos os produtos foram carregados."
    } catch {
      scrollStatus = "Erro de conexão. Role novamente para tentar."
    } finally {
      infiniteLoading = false
    }
  }

  function autoAnimateAction(node) {
    const controller = autoAnimate(node, {
      duration: 220,
      easing: "cubic-bezier(.2,.8,.2,1)",
    })

    return {
      destroy() {
        controller.destroy()
      },
    }
  }

  function normalizedPrices(nextMin = priceMin, nextMax = priceMax) {
    let min = Number(nextMin)
    let max = Number(nextMax)

    if (min > max) {
      ;[min, max] = [max, min]
    }

    return { min, max }
  }

  function paramsFor(overrides = {}) {
    const nextPrices = normalizedPrices(
      overrides.priceMin ?? priceMin,
      overrides.priceMax ?? priceMax,
    )
    const nextCategories = overrides.categories ?? selectedCategories
    const next = {
      q: overrides.q ?? search.trim(),
      categories: nextCategories,
      tag: overrides.tag ?? selectedTag,
      priceMin: nextPrices.min,
      priceMax: nextPrices.max,
      page: overrides.page ?? 1,
    }
    const params = {}

    if (next.q) params.q = next.q
    if (next.categories.length) params.categorias = next.categories
    if (next.tag) params.tags = next.tag
    if (priceBounds.max > priceBounds.min && next.priceMin > priceBounds.min) {
      params.price_min = next.priceMin
    }
    if (priceBounds.max > priceBounds.min && next.priceMax < priceBounds.max) {
      params.price_max = next.priceMax
    }
    if (next.page > 1) params.page = next.page

    return params
  }

  function applyFilters(overrides = {}, options = {}) {
    if (filterTimer) clearTimeout(filterTimer)

    const {
      closeSheet = false,
      delay: _delay,
      loadingLabel: nextLoadingLabel,
      ...routerOptions
    } = options
    const nextPrices = normalizedPrices(
      overrides.priceMin ?? priceMin,
      overrides.priceMax ?? priceMax,
    )

    priceMin = nextPrices.min
    priceMax = nextPrices.max
    if (closeSheet) void closeFilterSheet()

    isCatalogLoading = true
    loadingLabel = nextLoadingLabel || "Atualizando produtos"
    liveStatus = loadingLabel

    router.get("/", paramsFor({ ...overrides, priceMin, priceMax }), {
      preserveState: true,
      preserveScroll: routerOptions.preserveScroll ?? true,
      replace: true,
      onSuccess: (page) => {
        const nextProps = page.props || {}

        feedSnapshotKey = ""
        if (Array.isArray(nextProps.products)) liveProducts = nextProps.products
        if (nextProps.pagination) livePagination = nextProps.pagination
        if (nextProps.price_bounds) livePriceBounds = nextProps.price_bounds
      },
      onFinish: () => {
        isCatalogLoading = false
        liveStatus = "Catálogo atualizado."
      },
      onCancel: () => {
        isCatalogLoading = false
      },
      onError: () => {
        isCatalogLoading = false
        liveStatus = "Não foi possível atualizar o catálogo."
      },
      ...routerOptions,
    })
  }

  function scheduleFilters(overrides = {}, options = {}) {
    if (filterTimer) clearTimeout(filterTimer)

    isCatalogLoading = true
    loadingLabel = options.loadingLabel || "Atualizando produtos"
    liveStatus = loadingLabel

    filterTimer = setTimeout(() => {
      applyFilters(overrides, options)
    }, options.delay ?? liveFilterDelay)
  }

  function submitSearch() {
    applyFilters({ q: search.trim(), page: 1 }, { loadingLabel: "Buscando produtos" })
  }

  function handleSearchInput(event) {
    search = event.currentTarget.value
    scheduleFilters(
      { q: search.trim(), page: 1 },
      { delay: liveSearchDelay, loadingLabel: "Buscando produtos" },
    )
  }

  function selectCategory(category) {
    if (!category) {
      selectedCategories = []
    } else if (selectedCategories.includes(category)) {
      selectedCategories = selectedCategories.filter((slug) => slug !== category)
    } else {
      selectedCategories = [...selectedCategories, category]
    }

    scheduleFilters(
      { categories: selectedCategories, page: 1 },
      { delay: 90, loadingLabel: "Filtrando categoria" },
    )
  }

  function selectTag(tag) {
    selectedTag = tag
    scheduleFilters({ tag, page: 1 }, { delay: 90, loadingLabel: "Filtrando tag" })
  }

  function clearFilters() {
    search = ""
    selectedCategories = []
    filterSheetCategories = []
    selectedTag = ""
    priceMin = priceBounds.min
    priceMax = priceBounds.max
    applyFilters(
      {
        q: "",
        categories: [],
        tag: "",
        priceMin,
        priceMax,
        page: 1,
      },
      { closeSheet: true, loadingLabel: "Limpando filtros" },
    )
  }

  function clearSearch() {
    search = ""
    applyFilters({ q: "", page: 1 }, { loadingLabel: "Limpando busca" })
  }

  function clearPrice() {
    priceMin = priceBounds.min
    priceMax = priceBounds.max
    applyFilters({ priceMin, priceMax, page: 1 }, { loadingLabel: "Limpando faixa de FITC" })
  }

  function normalizePriceInput(changed) {
    priceMin = Number(priceMin)
    priceMax = Number(priceMax)

    if (changed === "min" && priceMin > priceMax) priceMax = priceMin
    if (changed === "max" && priceMax < priceMin) priceMin = priceMax
  }

  function handlePriceInput(changed) {
    normalizePriceInput(changed)
    scheduleFilters(
      { priceMin, priceMax, page: 1 },
      { delay: livePriceDelay, loadingLabel: "Ajustando faixa de FITC" },
    )
  }

  function priceSliderAction(node) {
    const inputMin = node.querySelector("[data-price-input-min]")
    const inputMax = node.querySelector("[data-price-input-max]")
    const range = node.querySelector("[data-price-range]")

    if (!inputMin || !inputMax || !range) return {}

    function updateRange() {
      const min = parseInt(inputMin.min, 10)
      const max = parseInt(inputMin.max, 10)
      const valMin = parseInt(inputMin.value, 10)
      const valMax = parseInt(inputMax.value, 10)
      const span = Math.max(max - min, 1)
      const percentMin = ((valMin - min) / span) * 100
      const percentMax = ((valMax - min) / span) * 100

      range.style.left = `${percentMin}%`
      range.style.width = `${percentMax - percentMin}%`
    }

    function onInput() {
      let valMin = parseInt(inputMin.value, 10)
      let valMax = parseInt(inputMax.value, 10)

      if (valMin > valMax - 1) {
        valMin = Math.max(valMax - 1, parseInt(inputMin.min, 10))
        inputMin.value = String(valMin)
      }

      priceMin = valMin
      priceMax = valMax
      updateRange()
    }

    inputMin.addEventListener("input", onInput)
    inputMax.addEventListener("input", onInput)
    updateRange()

    return {
      update() {
        updateRange()
      },
      destroy() {
        inputMin.removeEventListener("input", onInput)
        inputMax.removeEventListener("input", onInput)
      },
    }
  }

  function openProduct(product) {
    selectedProduct = product
    modalOpen = true
  }

  function closeModal() {
    modalOpen = false
    selectedProduct = null
  }

  function closeLoginModal() {
    loginModalOpen = false
    loginModalError = ""
  }

  function openLoginModal() {
    loginModalError = ""
    loginModalOpen = true
    if (mobileSearchOpen) closeMobileSearch()
  }

  function handleLoginSuccess() {
    loginModalError = ""
    closeLoginModal()
  }

  function handleLoginRequired() {
    openLoginModal()
  }

  function isMobileViewport() {
    return typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches
  }

  async function focusSearch() {
    if (isMobileViewport()) {
      mobileSearchOpen = true
      await tick()
      mobileSearchFloatInput?.focus()
      return
    }

    desktopSearchInput?.focus()
  }

  function closeMobileSearch() {
    mobileSearchOpen = false
  }

  function handleGlobalKeydown(event) {
    const key = event.key?.toLowerCase()

    if ((event.ctrlKey || event.metaKey) && key === "k") {
      event.preventDefault()
      void focusSearch()
      return
    }

    if (event.key === "Escape") {
      if (loginModalOpen) {
        event.preventDefault()
        closeLoginModal()
        return
      }

      if (mobileSearchOpen) {
        event.preventDefault()
        closeMobileSearch()
        return
      }

      if (filterSheetVisible) {
        event.preventDefault()
        void closeFilterSheet()
      }
    }
  }

  function sidebarLinkClass(active) {
    return `catalog-sidebar__link ${active ? "is-active active" : ""}`
  }

  function openFilterSheet() {
    if (filterSheetVisible) return
    filterSheetCategories = [...selectedCategories]
    filterSheetOpen = true
    filterSheetVisible = true
  }

  function toggleFilterSheetCategory(slug) {
    if (filterSheetCategories.includes(slug)) {
      filterSheetCategories = filterSheetCategories.filter((item) => item !== slug)
    } else {
      filterSheetCategories = [...filterSheetCategories, slug]
    }
  }

  function applyFilterSheet() {
    selectedCategories = [...filterSheetCategories]
    applyFilters(
      { categories: filterSheetCategories, page: 1 },
      { closeSheet: true, loadingLabel: "Filtrando categoria" },
    )
  }

  function clearFilterSheetCategories() {
    filterSheetCategories = []
  }

  async function closeFilterSheet() {
    if (!filterSheetVisible || filterSheetClosing) return

    filterSheetClosing = true
    filterSheetOpen = false
    document.body.classList.remove("filter-sheet-open")

    await new Promise((resolve) => setTimeout(resolve, 280))

    filterSheetVisible = false
    filterSheetClosing = false
  }

  function sheetChipClass(slug) {
    return `filter-sheet-chip ${filterSheetCategories.includes(slug) ? "active" : ""}`
  }

  function removeCategory(slug) {
    selectedCategories = selectedCategories.filter((item) => item !== slug)
    applyFilters({ categories: selectedCategories, page: 1 }, { loadingLabel: "Filtrando categoria" })
  }
</script>

<svelte:head>
  <title>Fit Store - A Loja do Movimenta+</title>
</svelte:head>

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="fit-store-page">
  <a href="#catalog-content" class="skip-link">Ir para o catálogo</a>

  <header class="topbar">
    <div class="topbar-row topbar-row--primary">
      <div class="topbar-brand topbar-brand--desktop">
        <a href="/" class="topbar-title" aria-label="Movimenta+ Fit Store">
          <span class="brand-eyebrow">MOVIMENTA+</span>
          <span class="brand-name">Fit Store</span>
        </a>
      </div>

      <div class="topbar-brand topbar-brand--mobile">
        <a href="/" class="topbar-app-mark" aria-label="Movimenta+ Fit Store">
          <img src="/logo.svg" alt="" class="topbar-app-mark__logo" width="32" height="32" decoding="async" />
          <span class="topbar-app-mark__text">
            <span class="topbar-app-mark__eyebrow">Movimenta+</span>
            <span class="topbar-app-mark__name">Fit Store</span>
          </span>
        </a>
      </div>

      <div class="topbar-mobile-actions">
        {#if currentEmployee}
          <a href="/colaborador" class="topbar-mobile-chip topbar-mobile-chip--balance" aria-label="Seu saldo FITC">
            <span class="topbar-mobile-chip__dot" aria-hidden="true"></span>
            {balanceFitc} FITC
          </a>
        {:else}
          <span class="topbar-mobile-chip topbar-mobile-chip--muted" aria-label="Preços em FITC">
            <span class="topbar-mobile-chip__dot" aria-hidden="true"></span>
            FITC
          </span>
        {/if}
      </div>

      <form
        class="header-search-wrap header-search-wrap--desktop"
        role="search"
        onsubmit={(event) => {
          event.preventDefault()
          submitSearch()
        }}
      >
        <label class="header-search" for="catalog-search-desktop">
          <span class="header-search__icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="16" height="16">
              <path
                d="M8.8 3.4a5.4 5.4 0 1 1 0 10.8 5.4 5.4 0 0 1 0-10.8Zm4.1 9.5 3.7 3.7"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </span>
          <input
            id="catalog-search-desktop"
            type="search"
            bind:this={desktopSearchInput}
            bind:value={search}
            placeholder="Buscar..."
            aria-label="Buscar produto"
            oninput={handleSearchInput}
          />
          {#if search}
            <button
              type="button"
              class="header-search__clear"
              aria-label="Limpar busca"
              onclick={clearSearch}
            >
              &times;
            </button>
          {/if}
          <kbd class="header-search__kbd" aria-hidden="true">
            <span>Ctrl</span>
            <span>K</span>
          </kbd>
        </label>
      </form>

      <button
        type="button"
        class="filter-toggle"
        aria-label="Abrir filtros"
        aria-expanded={filterSheetOpen}
        onclick={openFilterSheet}
      >
        <span>Filtros</span>
        {#if activeFilterCount > 0}
          <span class="filter-toggle__count">{activeFilterCount}</span>
        {/if}
      </button>

      <span class="fitcoin-badge" aria-label="Preços em FITC">
        <span class="fitcoin-badge__dot" aria-hidden="true"></span>
        <span>Preços em</span>
        <strong>FITC</strong>
      </span>

      {#if currentEmployee}
        <a href="/colaborador" class="topbar-account" aria-label="Área do colaborador">
          <span class="topbar-account__balance">{balanceFitc} FITC</span>
          <span class="topbar-account__name">{employeeFirstName}</span>
        </a>
      {:else}
        <button type="button" class="topbar-login" onclick={openLoginModal}>
          <span>Entrar</span>
        </button>
      {/if}
    </div>

  </header>

  {#if mobileSearchOpen}
    <div class="mobile-search-float" role="search" aria-label="Buscar produtos">
      <form
        class="mobile-search-float__form"
        onsubmit={(event) => {
          event.preventDefault()
          submitSearch()
        }}
      >
        <label class="header-search header-search--float" for="catalog-search-mobile-float">
          <span class="header-search__icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="16" height="16">
              <path
                d="M8.8 3.4a5.4 5.4 0 1 1 0 10.8 5.4 5.4 0 0 1 0-10.8Zm4.1 9.5 3.7 3.7"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </span>
          <input
            id="catalog-search-mobile-float"
            type="search"
            bind:this={mobileSearchFloatInput}
            bind:value={search}
            placeholder="Buscar produtos..."
            aria-label="Buscar produto"
            oninput={handleSearchInput}
          />
          {#if search}
            <button
              type="button"
              class="header-search__clear"
              aria-label="Limpar busca"
              onclick={clearSearch}
            >
              &times;
            </button>
          {/if}
        </label>
      </form>
      <button
        type="button"
        class="mobile-search-float__close"
        aria-label="Fechar busca"
        onclick={closeMobileSearch}
      >
        &times;
      </button>
    </div>
  {/if}

  <main id="catalog-content" aria-busy={isCatalogLoading}>
    <section class="catalog-intro" aria-labelledby="catalog-title">
      <div class="catalog-intro__content">
        <h1 id="catalog-title" class="catalog-intro__title">
          <span class="catalog-intro__title-text">Loja oficial</span>
          <img
            src="/logo.svg"
            alt="Movimenta+"
            class="catalog-intro__logo"
            width="461"
            height="181"
            decoding="async"
          />
        </h1>
        <p class="catalog-intro__text">
          Troque seu saldo de <strong>Fitcoin</strong> por equipamentos, suplementos
          e acessórios para turbinar seus treinos.
        </p>
      </div>
    </section>

    <div class="catalog-shell">
      <div class="catalog-toolbar">
        <div class="catalog-toolbar__row">
          <div class="catalog-status-line">
            <p class="catalog-count">{productCountLabel}</p>
            {#if isCatalogLoading}
              <p class="catalog-update-badge" role="status">{loadingLabel}</p>
            {/if}
            <p class="sr-only" aria-live="polite">{liveStatus}</p>
          </div>

          <div class="catalog-toolbar__mobile" aria-label="Filtros ativos">
            {#if hasActiveFilters}
              <p class="catalog-toolbar__mobile-label is-visible">Filtros ativos</p>
              <div class="active-filters-scroll" use:autoAnimateAction>
                {#if search}
                  <button type="button" class="filter-chip filter-chip--removable active" onclick={clearSearch}>
                    Busca: {search}<span aria-hidden="true">&times;</span>
                  </button>
                {/if}
                {#each selectedCategories as slug (slug)}
                  <button
                    type="button"
                    class="filter-chip filter-chip--removable active"
                    onclick={() => removeCategory(slug)}
                  >
                    {categoryLabels[slug] || slug}
                    <span aria-hidden="true">&times;</span>
                  </button>
                {/each}
                {#if selectedTag}
                  <button
                    type="button"
                    class="filter-chip filter-chip--removable active"
                    onclick={() => {
                      selectedTag = ""
                      applyFilters({ tag: "", page: 1 })
                    }}
                  >
                    {selectedTag}<span aria-hidden="true">&times;</span>
                  </button>
                {/if}
                {#if hasPriceFilter}
                  <button type="button" class="filter-chip filter-chip--removable active" onclick={clearPrice}>
                    {priceMin}-{priceMax} FITC<span aria-hidden="true">&times;</span>
                  </button>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <div class="catalog-layout">
        <aside class="catalog-sidebar" aria-label="Filtros do catálogo">
          <section class="catalog-sidebar__section" aria-labelledby="desktop-category-filter">
            <h2 id="desktop-category-filter" class="catalog-sidebar__title">Categorias</h2>
            <button
              type="button"
              class={sidebarLinkClass(selectedCategories.length === 0)}
              aria-pressed={selectedCategories.length === 0}
              onclick={() => selectCategory("")}
            >
              <span class="catalog-sidebar__check" aria-hidden="true"></span>
              <span>Todos os produtos</span>
            </button>
            {#each categories as category (category.slug)}
              <button
                type="button"
                class={sidebarLinkClass(selectedCategories.includes(category.slug))}
                aria-pressed={selectedCategories.includes(category.slug)}
                onclick={() => selectCategory(category.slug)}
              >
                <span class="catalog-sidebar__check" aria-hidden="true"></span>
                <span>{category.label}</span>
              </button>
            {/each}
          </section>

          {#if tags.length}
            <section class="catalog-sidebar__section" aria-labelledby="desktop-tag-filter">
              <h2 id="desktop-tag-filter" class="catalog-sidebar__title">Tags</h2>
              <button
                type="button"
                class={sidebarLinkClass(!selectedTag)}
                aria-pressed={!selectedTag}
                onclick={() => selectTag("")}
              >
                <span class="catalog-sidebar__check" aria-hidden="true"></span>
                <span>Todas as tags</span>
              </button>
              {#each tags as tag (tag.name)}
                <button
                  type="button"
                  class={sidebarLinkClass(selectedTag === tag.name)}
                  aria-pressed={selectedTag === tag.name}
                  onclick={() => selectTag(tag.name)}
                >
                  <span class="catalog-sidebar__check" aria-hidden="true"></span>
                  <span>{tag.name}</span>
                </button>
              {/each}
            </section>
          {/if}

          <section class="catalog-sidebar__section" aria-labelledby="desktop-price-filter">
            <h2 id="desktop-price-filter" class="catalog-sidebar__title">Faixa de preço</h2>
            <div class="price-slider" use:priceSliderAction>
              <div class="price-slider__labels">
                <span class="price-slider__value" data-price-min-label>{priceMin}</span>
                <span class="price-slider__separator">até</span>
                <span class="price-slider__value" data-price-max-label>{priceMax}</span>
                <span class="price-slider__unit">FITC</span>
              </div>
              <div class="price-slider__track" data-price-track>
                <div class="price-slider__range" data-price-range></div>
                <input
                  type="range"
                  class="price-slider__input price-slider__input--min"
                  data-price-input-min
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step="1"
                  bind:value={priceMin}
                  oninput={() => handlePriceInput("min")}
                />
                <input
                  type="range"
                  class="price-slider__input price-slider__input--max"
                  data-price-input-max
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step="1"
                  bind:value={priceMax}
                  oninput={() => handlePriceInput("max")}
                />
              </div>
              <div class="price-slider__bounds">
                <span>{priceBounds.min}</span>
                <span>{priceBounds.max} FITC</span>
              </div>
              {#if hasPriceFilter}
                <button type="button" class="price-slider__clear" onclick={clearPrice}>
                  Limpar filtro de preço
                </button>
              {/if}
            </div>
          </section>

          {#if hasActiveFilters}
            <button type="button" class="catalog-sidebar__clear" onclick={clearFilters}>
              Limpar filtros
            </button>
          {/if}
        </aside>

        <section
          class={`catalog-results ${isCatalogLoading ? "is-loading" : ""}`}
          aria-label="Produtos"
        >
          {#if catalogProducts.length === 0}
            <div class="empty-state" role="status">
              <p>Nenhum produto encontrado.</p>
              <button type="button" class="secondary-button" onclick={clearFilters}>
                Limpar filtros
              </button>
            </div>
          {:else}
            <div class="products-grid" use:autoAnimateAction data-products-grid>
              {#each catalogProducts as product, index (product.id)}
                {#if index === 0 && ctaCardsBySlot[1]}
                  <CatalogFeatureCard card={ctaCardsBySlot[1]} />
                {/if}

                {#if index === 4 && ctaCardsBySlot[2]}
                  <CatalogFeatureCard card={ctaCardsBySlot[2]} />
                {/if}

                <ProductCard
                  {product}
                  categoryLabel={categoryLabels[product.category] || product.category}
                  onSelect={openProduct}
                />
              {/each}
            </div>

            {#if feedHasMore}
              <div
                class="catalog-scroll-sentinel"
                data-catalog-sentinel
                bind:this={scrollSentinel}
                aria-hidden="true"
              ></div>
            {/if}

            {#if scrollStatus || infiniteLoading}
              <p class="catalog-scroll-status" role="status" aria-live="polite">
                {infiniteLoading ? "Carregando mais produtos…" : scrollStatus}
              </p>
            {/if}
          {/if}

          {#if isCatalogLoading}
            <div class="products-grid products-grid--skeleton" aria-hidden="true">
              {#each Array(6) as _, index}
                <article class="product-skeleton">
                  <div class="product-skeleton__image"></div>
                  <div class="product-skeleton__line product-skeleton__line--title"></div>
                  <div class="product-skeleton__line product-skeleton__line--meta"></div>
                </article>
              {/each}
            </div>
          {/if}
        </section>
      </div>
    </div>
  </main>

  <nav class="mobile-app-nav" aria-label="Menu rápido da loja">
    <a
      href="#catalog-content"
      class={`mobile-app-nav__item ${mobileSearchOpen || loginModalOpen ? "" : "is-active"}`}
      onclick={() => {
        closeMobileSearch()
        closeLoginModal()
      }}
    >
      <span>Loja</span>
    </a>
    <button
      type="button"
      class={`mobile-app-nav__item ${mobileSearchOpen ? "is-active" : ""}`}
      aria-expanded={mobileSearchOpen}
      onclick={() => focusSearch()}
    >
      <span>Buscar</span>
    </button>
    <button
      type="button"
      class="mobile-app-nav__item"
      aria-expanded={filterSheetOpen}
      onclick={openFilterSheet}
    >
      <span>Filtros</span>
      {#if activeFilterCount > 0}
        <strong class="mobile-app-nav__count">{activeFilterCount}</strong>
      {/if}
    </button>
    {#if currentEmployee}
      <a href="/colaborador" class="mobile-app-nav__item">
        <span>Conta</span>
      </a>
    {:else}
      <button
        type="button"
        class={`mobile-app-nav__item ${loginModalOpen ? "is-active" : ""}`}
        aria-expanded={loginModalOpen}
        onclick={openLoginModal}
      >
        <span>Entrar</span>
      </button>
    {/if}
  </nav>

  {#if filterSheetVisible}
    <button
      type="button"
      class="filter-sheet-backdrop"
      aria-label="Fechar filtros"
      onclick={() => closeFilterSheet()}
    ></button>
    <div
      class="filter-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-filter-title"
    >
      <div class="filter-sheet__handle" aria-hidden="true"></div>
      <div class="filter-sheet__header">
        <h2 id="mobile-filter-title">Filtrar categorias</h2>
        <button
          type="button"
          class="filter-sheet__close"
          aria-label="Fechar filtros"
          onclick={() => closeFilterSheet()}
        >
          &times;
        </button>
      </div>

      <div class="filter-sheet__body">
        <div data-filter-sheet-grid>
          {#each categories as category (category.slug)}
            <button
              type="button"
              class={sheetChipClass(category.slug)}
              data-filter-sheet-chip
              data-category={category.slug}
              onclick={() => toggleFilterSheetCategory(category.slug)}
            >
              {category.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="filter-sheet__footer">
        <button type="button" class="btn-sheet secondary" onclick={clearFilterSheetCategories}>
          Limpar
        </button>
        <button type="button" class="btn-sheet primary" onclick={applyFilterSheet}>
          Aplicar
        </button>
      </div>
    </div>
  {/if}
</div>

<TradeModal
  product={selectedProduct}
  products={catalogProducts}
  {categoryLabels}
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
  returnTo="/"
  onClose={closeLoginModal}
  onSuccess={handleLoginSuccess}
/>
