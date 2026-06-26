<script>
  import {
    formatSelectionSummary,
    getDefaultSelections,
    resolveProductPresentation,
    validateSelections,
  } from "../lib/product-variations.js"

  let {
    product = null,
    open = false,
    employeeMode = false,
    balanceFitc = null,
    onClose = () => {},
    onConfirm = null,
  } = $props()

  let selections = $state({})
  let step = $state("detail")
  let error = $state("")

  $effect(() => {
    if (open && product) {
      selections = getDefaultSelections(product)
      step = "detail"
      error = ""
    }
  })

  let presentation = $derived(product ? resolveProductPresentation(product, selections) : null)
  let summaryLines = $derived(product ? formatSelectionSummary(product, selections) : [])

  function chooseOption(attributeId, optionId) {
    selections = { ...selections, [String(attributeId)]: String(optionId) }
  }

  function goToConfirm() {
    if (!product) return
    const result = validateSelections(product, selections)
    if (!result.ok) {
      error = result.error
      return
    }
    error = ""
    step = "confirm"
  }

  function handleConfirm() {
    if (onConfirm) {
      onConfirm({ product, selections, presentation })
    } else {
      step = "success"
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onClose()
  }
</script>

{#if open && product}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="presentation"
    onclick={handleBackdropClick}
  >
    <div
      class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-modal-title"
    >
      {#if step === "detail"}
        <h2 id="trade-modal-title" class="text-lg font-bold text-slate-900">{product.name}</h2>

        {#if presentation?.image_url}
          <img
            src={presentation.image_url}
            alt={product.name}
            class="mt-4 w-full rounded-lg object-cover"
          />
        {/if}

        <p class="mt-3 text-xl font-bold text-teal">
          {presentation?.price_fitc}
          <span class="text-sm font-normal text-slate-500">FITC</span>
        </p>

        {#if product.description}
          <p class="mt-3 text-sm leading-relaxed text-slate-600">{product.description}</p>
        {/if}

        {#if employeeMode && balanceFitc != null}
          <p class="mt-2 text-sm text-slate-500">
            Seu saldo: <strong class="text-slate-700">{balanceFitc} FITC</strong>
          </p>
        {/if}

        {#each product.variations || [] as attr (attr.id)}
          <fieldset class="mt-4">
            <legend class="mb-2 text-sm font-semibold text-slate-800">
              {attr.name}
              {#if attr.unit}
                <span class="font-normal text-slate-500">({attr.unit})</span>
              {/if}
              {#if !attr.required}
                <span class="font-normal text-slate-400">(opcional)</span>
              {/if}
            </legend>
            <div class="flex flex-wrap gap-2">
              {#each attr.options || [] as option (option.id)}
                <label class="cursor-pointer">
                  <input
                    type="radio"
                    class="peer sr-only"
                    name={`variation-${attr.id}`}
                    value={option.id}
                    checked={selections[String(attr.id)] === String(option.id)}
                    onchange={() => chooseOption(attr.id, option.id)}
                  />
                  <span
                    class="inline-block rounded-lg border border-slate-200 px-3 py-1.5 text-sm peer-checked:border-teal peer-checked:bg-teal/10 peer-checked:text-teal-dark"
                  >
                    {option.label}
                  </span>
                </label>
              {/each}
            </div>
          </fieldset>
        {/each}

        {#if error}
          <p class="mt-3 text-sm text-red-600" role="alert">{error}</p>
        {/if}

        <div class="mt-6 flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            onclick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark"
            onclick={goToConfirm}
          >
            Continuar
          </button>
        </div>
      {:else if step === "confirm"}
        <h2 class="text-lg font-bold text-slate-900">Confirmar resgate</h2>
        <p class="mt-2 text-sm text-slate-600">
          Você está resgatando <strong>{product.name}</strong> por
          <strong class="text-teal">{presentation?.price_fitc} FITC</strong>.
        </p>

        {#if summaryLines.length}
          <ul class="mt-3 space-y-1 text-sm text-slate-600">
            {#each summaryLines as line}
              <li>{line}</li>
            {/each}
          </ul>
        {/if}

        <div class="mt-6 flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            onclick={() => (step = "detail")}
          >
            Voltar
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark"
            onclick={handleConfirm}
          >
            Confirmar resgate
          </button>
        </div>
      {:else}
        <div class="py-4 text-center">
          <p class="text-lg font-bold text-green-600">Resgate registrado!</p>
          <p class="mt-2 text-sm text-slate-600">
            Em breve você receberá a confirmação por e-mail.
          </p>
          <button
            type="button"
            class="mt-6 rounded-lg bg-teal px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark"
            onclick={onClose}
          >
            Fechar
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
