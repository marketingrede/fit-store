<script>
  import { tick } from "svelte"
  import {
    animateBackdropIn,
    animateBackdropOut,
    animateModalOut,
    resetMediaExpanded,
    setMediaExpanded,
  } from "../lib/product-modal-motion.js"
  import {
    animateCardDragRelease,
    applyCardDragTransform,
    clearCardDragStyles,
    runTinderGalleryTransition,
  } from "../lib/product-modal-transitions.js"
  import {
    formatSelectionSummary,
    getDefaultSelections,
    resolveProductPresentation,
    validateSelections,
  } from "../lib/product-variations.js"

  let {
    product = null,
    products = [],
    categoryLabels = {},
    open = false,
    employeeMode = false,
    balanceFitc = null,
    onClose = () => {},
    onConfirm = null,
    onLoginRequired = () => {},
  } = $props()

  let activeProduct = $state(null)
  let selections = $state({})
  let step = $state("detail")
  let error = $state("")
  let mediaExpanded = $state(false)
  let cardShellElement = $state(null)
  let cardBodyElement = $state(null)
  let backdropElement = $state(null)
  let visible = $state(false)
  let closing = $state(false)
  let galleryTransitioning = $state(false)
  let navDirection = $state(1)
  let touchStartX = $state(0)
  let touchStartY = $state(0)
  let dragOffsetX = $state(0)
  let isDraggingCard = $state(false)
  let confirming = $state(false)
  let idempotencyKey = $state("")

  $effect(() => {
    if (open && product) {
      void showModal(product)
    } else if (!open && visible && !closing) {
      void requestClose()
    }
  })

  $effect(() => {
    if (!visible || typeof document === "undefined") return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  })

  let galleryProducts = $derived(products.length ? products : activeProduct ? [activeProduct] : [])
  let activeIndex = $derived(
    galleryProducts.findIndex((item) => String(item.id) === String(activeProduct?.id)),
  )
  let canNavigate = $derived(galleryProducts.length > 1 && activeIndex >= 0)
  let presentation = $derived(
    activeProduct ? resolveProductPresentation(activeProduct, selections) : null,
  )
  let summaryLines = $derived(
    activeProduct ? formatSelectionSummary(activeProduct, selections) : [],
  )
  let categoryLabel = $derived(
    categoryLabels[activeProduct?.category] || activeProduct?.category || "",
  )
  let hasEnoughBalance = $derived(
    !employeeMode ||
      balanceFitc == null ||
      Number(balanceFitc) >= Number(presentation?.price_fitc || 0),
  )

  async function showModal(nextProduct) {
    closing = false
    activeProduct = nextProduct
    selections = getDefaultSelections(nextProduct)
    step = "detail"
    error = ""
    mediaExpanded = false
    idempotencyKey = ""
    visible = true

    await tick()
    cardShellElement?.focus()

    await animateBackdropIn(backdropElement)
  }

  async function requestClose() {
    if (!visible || closing) return

    closing = true
    resetMediaExpanded()

    await Promise.all([
      animateBackdropOut(backdropElement),
      animateModalOut(cardShellElement),
    ])

    visible = false
    closing = false
    activeProduct = null
    mediaExpanded = false
    step = "detail"
    error = ""
    onClose()
  }

  function chooseOption(attributeId, optionId) {
    selections = { ...selections, [String(attributeId)]: String(optionId) }
  }

  function selectProductAt(index) {
    const nextProduct = galleryProducts[index]
    if (!nextProduct) return

    resetMediaExpanded()
    activeProduct = nextProduct
    selections = getDefaultSelections(nextProduct)
    step = "detail"
    error = ""
    mediaExpanded = false
    idempotencyKey = ""
  }

  async function moveProduct(delta) {
    if (!canNavigate || galleryTransitioning || mediaExpanded || step !== "detail") return

    const nextIndex = (activeIndex + delta + galleryProducts.length) % galleryProducts.length
    if (nextIndex === activeIndex) return

    navDirection = delta > 0 ? 1 : -1
    galleryTransitioning = true
    resetMediaExpanded()

    const startX = isDraggingCard ? dragOffsetX : 0
    isDraggingCard = false
    dragOffsetX = 0

    try {
      await runTinderGalleryTransition(
        cardShellElement,
        navDirection,
        startX,
        async () => {
          selectProductAt(nextIndex)
          await tick()
        },
      )
    } finally {
      galleryTransitioning = false
      clearCardDragStyles(cardShellElement)
      dragOffsetX = 0
      isDraggingCard = false
    }
  }

  function handleCardTouchStart(event) {
    if (!canNavigate || step !== "detail" || galleryTransitioning) return

    touchStartX = event.touches[0]?.clientX ?? 0
    touchStartY = event.touches[0]?.clientY ?? 0
    dragOffsetX = 0
    isDraggingCard = false
  }

  function handleCardTouchMove(event) {
    if (!canNavigate || galleryTransitioning || mediaExpanded || step !== "detail") return

    const touch = event.touches[0]
    if (!touch) return

    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY

    if (!isDraggingCard) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) return
      if (Math.abs(deltaX) < 10) return
      isDraggingCard = true
    }

    event.preventDefault()
    dragOffsetX = deltaX
    applyCardDragTransform(cardShellElement, deltaX)
  }

  async function handleCardTouchEnd(event) {
    if (!canNavigate || galleryTransitioning || mediaExpanded || step !== "detail") return

    if (isDraggingCard) {
      const threshold = 72

      if (Math.abs(dragOffsetX) >= threshold) {
        await moveProduct(dragOffsetX < 0 ? 1 : -1)
        return
      }

      await animateCardDragRelease(cardShellElement, dragOffsetX)
      dragOffsetX = 0
      isDraggingCard = false
      return
    }

    const touch = event.changedTouches[0]
    if (!touch) return

    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) return

    await moveProduct(deltaX < 0 ? 1 : -1)
  }

  async function toggleMediaExpanded() {
    if (!cardBodyElement) return

    const nextExpanded = !mediaExpanded

    if (nextExpanded) {
      mediaExpanded = true
    }

    await setMediaExpanded(cardBodyElement, nextExpanded)
    mediaExpanded = nextExpanded
  }

  function goToConfirm() {
    if (!activeProduct) return

    const result = validateSelections(activeProduct, selections)
    if (!result.ok) {
      error = result.error
      return
    }

    if (!employeeMode) {
      onLoginRequired()
      return
    }

    if (!hasEnoughBalance) {
      error = "Saldo insuficiente para este resgate."
      return
    }

    idempotencyKey ||= generateIdempotencyKey()
    error = ""
    step = "confirm"
  }

  async function handleConfirm() {
    if (!onConfirm) return

    confirming = true
    error = ""

    try {
      await onConfirm({ product: activeProduct, selections, presentation, idempotencyKey })
      step = "success"
    } catch (caught) {
      error = caught?.message || "Não foi possível concluir o resgate."
      step = "detail"
    } finally {
      confirming = false
    }
  }

  function handleBackdropClick(event) {
    const isOverlay = event.target === event.currentTarget
    const isBackdrop = event.target?.classList?.contains("product-modal-backdrop")
    if (isOverlay || isBackdrop) void requestClose()
  }

  function handleWindowKeydown(event) {
    if (!visible) return

    if (event.key === "Escape") {
      event.preventDefault()
      void requestClose()
      return
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault()
      void moveProduct(-1)
      return
    }

    if (event.key === "ArrowRight") {
      event.preventDefault()
      void moveProduct(1)
    }
  }

  function generateIdempotencyKey() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if visible && activeProduct}
  <div
    class="modal-overlay modal-overlay--product"
    role="presentation"
    aria-hidden={!visible}
    onclick={handleBackdropClick}
  >
    <div
      class="product-modal-backdrop is-visible"
      aria-hidden="true"
      bind:this={backdropElement}
    ></div>

    <div class="product-modal-stage">
      {#if canNavigate}
        <button
          type="button"
          class="product-modal__nav product-modal__nav--prev"
          aria-label="Produto anterior"
          disabled={galleryTransitioning}
          onclick={() => moveProduct(-1)}
        >
          <span aria-hidden="true">&lsaquo;</span>
        </button>
      {/if}

      <div class="product-modal-shell" role="presentation">
          <div class="product-modal-card-viewport">
              <div
                class={`modal modal--product modal--product-card ${galleryTransitioning ? "is-gallery-transitioning" : ""} ${isDraggingCard ? "is-card-dragging" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="trade-modal-title"
                tabindex="-1"
                bind:this={cardShellElement}
                ontouchstart={handleCardTouchStart}
                ontouchmove={handleCardTouchMove}
                ontouchend={handleCardTouchEnd}
              >
          <button
            type="button"
            class="product-modal__close"
            aria-label="Fechar detalhes do produto"
            onclick={() => requestClose()}
          >
            <span aria-hidden="true">&times;</span>
          </button>

              <article
                class={`product-modal-card ${mediaExpanded ? "is-media-expanded" : ""}`}
                bind:this={cardBodyElement}
              >
            <button
              type="button"
              class="product-modal-card__media"
              aria-label={mediaExpanded ? "Recolher imagem do produto" : "Ampliar imagem do produto"}
              aria-pressed={mediaExpanded}
              onclick={() => toggleMediaExpanded()}
            >
              {#if presentation?.image_url}
                <img src={presentation.image_url} alt={activeProduct.name} />
              {:else}
                <span class="product-image__fallback">Sem imagem</span>
              {/if}
              <span class="product-modal-card__media-badge">
                {mediaExpanded ? "Recolher" : "Ampliar"}
              </span>
              <span class="product-modal-card__media-watermark">
                Imagens meramente ilustrativas
              </span>
            </button>

            <div class="product-modal-card__body">
              {#if step === "detail"}
                <div class="product-modal-card__details">
                  {#if activeProduct.tag}
                    <p class="product-modal-card__meta">Tag: {activeProduct.tag}</p>
                  {:else if categoryLabel}
                    <p class="product-modal-card__meta">{categoryLabel}</p>
                  {/if}

                  <h2 id="trade-modal-title" class="product-modal-card__title">
                    {activeProduct.name}
                  </h2>

                  {#if activeProduct.description}
                    <p class="product-modal-card__desc">{activeProduct.description}</p>
                  {/if}

                  <p class="product-modal-card__price">
                    {presentation?.price_fitc}
                    <span>FITC</span>
                  </p>

                  {#if employeeMode && balanceFitc != null}
                    <p class="product-modal-card__hint">
                      Seu saldo: <strong>{balanceFitc} FITC</strong>
                    </p>
                  {:else}
                    <p class="product-modal-card__hint">
                      Escolha as opções disponíveis e confirme o resgate com seu saldo Fitcoin.
                    </p>
                  {/if}

                  {#each activeProduct.variations || [] as attr (attr.id)}
                    <fieldset class="product-variation">
                      <legend class="product-variation__label">
                        {attr.name}
                        {#if attr.unit}
                          <span class="product-variation__unit">({attr.unit})</span>
                        {/if}
                        {#if attr.required}
                          <span class="product-variation__required" aria-hidden="true">*</span>
                        {:else}
                          <span class="product-variation__optional">(opcional)</span>
                        {/if}
                      </legend>
                      <div class="product-variation__options" role="radiogroup" aria-label={attr.name}>
                        {#each attr.options || [] as option (option.id)}
                          <label class="product-variation__option">
                            <input
                              type="radio"
                              class="sr-only"
                              name={`variation-${activeProduct.id}-${attr.id}`}
                              value={option.id}
                              checked={selections[String(attr.id)] === String(option.id)}
                              onchange={() => chooseOption(attr.id, option.id)}
                            />
                            <span>{option.label}</span>
                          </label>
                        {/each}
                      </div>
                    </fieldset>
                  {/each}

                  {#if error}
                    <p class="product-modal-card__error" role="alert">{error}</p>
                  {/if}
                </div>

                <div class="product-modal-card__cta">
                  <button type="button" class="redeem-button" onclick={goToConfirm}>
                    {employeeMode ? "Quero trocar meus Fitcoin" : "Entrar para resgatar"}
                  </button>
                  <p class="cta-helper">
                    {#if employeeMode}
                      Ao confirmar, o saldo é debitado e o pedido fica registrado.
                    {:else}
                      Faça login com sua matrícula para resgatar com saldo FITC.
                    {/if}
                  </p>
                </div>
              {:else if step === "confirm"}
                <div class="product-modal-card__details">
                  <p class="product-modal-card__meta">Confirmação</p>
                  <h2 id="trade-modal-title" class="product-modal-card__title">Confirmar resgate</h2>
                  <p class="product-modal-card__desc">
                    Você está resgatando <strong>{activeProduct.name}</strong> por
                    <strong>{presentation?.price_fitc} FITC</strong>.
                  </p>

                  {#if summaryLines.length}
                    <ul class="selection-summary" aria-label="Opções escolhidas">
                      {#each summaryLines as line (line)}
                        <li>{line}</li>
                      {/each}
                    </ul>
                  {/if}
                </div>

                <div class="product-modal-card__cta product-modal-card__cta--split">
                  <button type="button" class="secondary-button" onclick={() => (step = "detail")}>
                    Voltar
                  </button>
                  <button type="button" class="redeem-button" disabled={confirming} onclick={handleConfirm}>
                    {confirming ? "Processando..." : "Confirmar resgate"}
                  </button>
                </div>
              {:else}
                <div class="product-modal-card__details product-modal-card__details--center">
                  <p class="success-mark" aria-hidden="true">OK</p>
                  <h2 id="trade-modal-title" class="product-modal-card__title">Resgate registrado</h2>
                  <p class="product-modal-card__desc">
                    Em breve você receberá a confirmação por e-mail.
                  </p>
                </div>

                <div class="product-modal-card__cta">
                  <button type="button" class="redeem-button" onclick={() => requestClose()}>
                    Fechar
                  </button>
                </div>
              {/if}
            </div>
          </article>
              </div>
          </div>
      </div>

      {#if canNavigate}
        <button
          type="button"
          class="product-modal__nav product-modal__nav--next"
          aria-label="Próximo produto"
          disabled={galleryTransitioning}
          onclick={() => moveProduct(1)}
        >
          <span aria-hidden="true">&rsaquo;</span>
        </button>
      {/if}
    </div>

    {#if canNavigate}
      <p class="product-modal__swipe-hint">Deslize ou use as setas para trocar</p>
    {/if}
  </div>
{/if}
