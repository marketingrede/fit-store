function qs(root, selector) {
  return root.querySelector(selector)
}

function qsa(root, selector) {
  return Array.from(root.querySelectorAll(selector))
}

function openOverlay(overlay) {
  overlay?.classList.add("is-open")
  overlay?.setAttribute("aria-hidden", "false")
  document.body.style.overflow = "hidden"
}

function closeOverlay(overlay) {
  overlay?.classList.remove("is-open")
  overlay?.setAttribute("aria-hidden", "true")
  document.body.style.overflow = ""
}

function defaultVariation() {
  return {
    name: "",
    unit: "",
    required: true,
    allow_option_image: false,
    options: [{ label: "", price_fitc_override: "", image_url: "" }]
  }
}

function renderVariations(container, variations) {
  if (!container) return

  container.innerHTML = variations
    .map((variation, index) => {
      const options = variation.options?.length
        ? variation.options
        : [{ label: "", price_fitc_override: "", image_url: "" }]

      return `
        <div class="admin-variation-block" data-variation-index="${index}">
          <div class="admin-variation-block__header">
            <button type="button" class="admin-variation-block__toggle" data-toggle-variation aria-expanded="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              <strong>Variação ${index + 1}</strong>
            </button>
            <button type="button" class="admin-danger-link" data-remove-variation>Remover</button>
          </div>
          <div class="admin-variation-block__body">
            <div class="admin-form-grid admin-form-grid--2">
              <div>
                <label>Nome</label>
                <input type="text" data-field="name" value="${variation.name || ""}" required>
              </div>
              <div>
                <label>Unidade</label>
                <input type="text" data-field="unit" value="${variation.unit || ""}">
              </div>
            </div>
            <label class="admin-checkbox-field">
              <input type="checkbox" data-field="required" ${variation.required ? "checked" : ""}>
              Obrigatória
            </label>
            <div data-options-root>
              ${options
                .map(
                  (option, optionIndex) => `
                <div class="admin-option-row" data-option-index="${optionIndex}">
                  <input type="text" data-option-field="label" value="${option.label || ""}" placeholder="Opção" required>
                  <input type="number" data-option-field="price_fitc_override" value="${option.price_fitc_override ?? ""}" placeholder="FITC" min="0">
                  <input type="file" accept="image/jpeg,image/png,image/webp" data-option-field="image_file" hidden>
                  <button type="button" class="admin-text-link" data-option-image-btn title="Adicionar imagem">📷</button>
                  <button type="button" class="admin-danger-link" data-remove-option>×</button>
                </div>`
                )
                .join("")}
            </div>
            <button type="button" class="admin-text-link" data-add-option>+ opção</button>
          </div>
        </div>`
    })
    .join("")
}

function readVariations(container) {
  return qsa(container, "[data-variation-index]").map((block) => ({
    name: qs(block, '[data-field="name"]')?.value || "",
    unit: qs(block, '[data-field="unit"]')?.value || "",
    required: qs(block, '[data-field="required"]')?.checked ?? true,
    allow_option_image: false,
    options: qsa(block, "[data-option-index]").map((row) => ({
      label: qs(row, '[data-option-field="label"]')?.value || "",
      price_fitc_override: qs(row, '[data-option-field="price_fitc_override"]')?.value || null,
      image_url: null
    }))
  }))
}

function updateMediaPreview(form, url) {
  const composer = form?.querySelector("[data-media-composer]")
  if (composer?._api) {
    composer._api.setImageUrl(url)
  } else {
    const preview = qs(form, "[data-product-media-preview]")
    if (preview) {
      preview.innerHTML = url
        ? `<img src="${url}" alt="">`
        : `<span class="admin-empty-text">Sem imagem</span>`
    }
  }
}

async function loadProductData(form, productId) {
  const response = await fetch(`/admin/produtos/${productId}/form_data`, {
    headers: { Accept: "application/json" }
  })
  if (!response.ok) throw new Error("Falha ao carregar produto")
  return response.json()
}

function fillProductForm(form, data) {
  form.action = `/admin/produtos/${data.id}`
  form.method = "post"

  let methodInput = qs(form, 'input[name="_method"]')
  if (!methodInput) {
    methodInput = document.createElement("input")
    methodInput.type = "hidden"
    methodInput.name = "_method"
    form.appendChild(methodInput)
  }
  methodInput.value = "patch"

  qs(form, "#product_name").value = data.name || ""
  qs(form, "#product_category").value = data.category || ""
  qs(form, "#product_price_fitc").value = data.price_fitc ?? ""
  qs(form, "#product_description").value = data.description || ""
  qs(form, "#product_image_url").value = data.image_url || ""
  qs(form, "#product_tag").value = data.tag || ""
  qs(form, "#product_active").checked = !!data.active

  updateMediaPreview(form, data.image_url)
  renderVariations(qs(form, "[data-variations-editor]"), data.variations?.length ? data.variations : [])
}

function resetProductForm(form) {
  form.action = "/admin/produtos"
  form.method = "post"
  qs(form, 'input[name="_method"]')?.remove()

  form.reset()
  qs(form, "#product_active").checked = true
  updateMediaPreview(form, "")
  renderVariations(qs(form, "[data-variations-editor]"), [defaultVariation()])
}

// URL params support
function parseModalParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    modal: params.get("modal"),
    editId: params.get("id"),
  }
}

function updateUrlParams(modal, id) {
  const url = new URL(window.location)
  if (modal) {
    url.searchParams.set("modal", modal)
    if (id) url.searchParams.set("id", id)
  } else {
    url.searchParams.delete("modal")
    url.searchParams.delete("id")
  }
  window.history.replaceState({}, "", url)
}

export function initAdminProducts() {
  const root = document.querySelector("[data-admin-products]")
  if (!root) return

  const overlay = document.getElementById("admin-product-modal")
  const form = overlay?.querySelector("form")
  const title = overlay?.querySelector("[data-product-modal-title]")
  const variationsEditor = form ? qs(form, "[data-variations-editor]") : null
  const bulkBar = root.querySelector(".admin-bulk-bar")
  const bulkForm = root.querySelector("[data-bulk-form]")
  const selectAll = root.querySelector("[data-select-all-products]")

  const refreshBulkBar = () => {
    const selected = qsa(root, "[data-product-select]:checked")
    bulkBar?.classList.toggle("is-visible", selected.length > 0)
    const count = bulkBar?.querySelector("[data-bulk-count]")
    if (count) count.textContent = `${selected.length} selecionado(s)`

    if (bulkForm) {
      bulkForm.querySelectorAll('input[name="product_ids[]"]').forEach((node) => node.remove())
      selected.forEach((checkbox) => {
        const input = document.createElement("input")
        input.type = "hidden"
        input.name = "product_ids[]"
        input.value = checkbox.value
        bulkForm.appendChild(input)
      })
    }
  }

  selectAll?.addEventListener("change", (event) => {
    qsa(root, "[data-product-select]").forEach((checkbox) => {
      checkbox.checked = event.target.checked
    })
    refreshBulkBar()
  })

  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-product-select]")) refreshBulkBar()
  })

  // Open create modal
  root.querySelector("[data-open-product-modal]")?.addEventListener("click", () => {
    if (!form) return
    title.textContent = "Novo produto"
    resetProductForm(form)
    openOverlay(overlay)
    updateUrlParams("create")
  })

  // Open edit modal
  root.querySelectorAll("[data-edit-product]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!form) return
      const productId = button.dataset.editProduct
      title.textContent = "Editar produto"
      try {
        const data = await loadProductData(form, productId)
        fillProductForm(form, data)
        openOverlay(overlay)
        updateUrlParams("edit", productId)
      } catch {
        window.location.href = `/admin/produtos/${productId}/edit`
      }
    })
  })

  // Close modal
  overlay?.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      closeOverlay(overlay)
      updateUrlParams(null)
    })
  })

  overlay?.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeOverlay(overlay)
      updateUrlParams(null)
    }
  })

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay?.classList.contains("is-open")) {
      closeOverlay(overlay)
      updateUrlParams(null)
    }
  })

  // Image URL input sync
  form?.addEventListener("input", (event) => {
    if (event.target.id === "product_image_url") {
      updateMediaPreview(form, event.target.value)
    }
  })

  // Media composer URL sync
  form?.querySelector("[data-media-composer]")?.addEventListener("composer:update", (event) => {
    const urlInput = qs(form, "#product_image_url")
    if (urlInput && event.detail?.url !== urlInput.value) {
      urlInput.value = event.detail?.url || ""
    }
  })

  // Variations events
  variationsEditor?.addEventListener("click", (event) => {
    const block = event.target.closest("[data-variation-index]")
    if (!block) return

    // Toggle collapse
    if (event.target.closest("[data-toggle-variation]")) {
      const body = qs(block, ".admin-variation-block__body")
      const toggle = qs(block, "[data-toggle-variation]")
      if (body && toggle) {
        const collapsed = body.style.display === "none"
        body.style.display = collapsed ? "" : "none"
        toggle.setAttribute("aria-expanded", String(collapsed))
      }
      return
    }

    if (event.target.matches("[data-remove-variation]")) {
      block.remove()
      if (!qsa(variationsEditor, "[data-variation-index]").length) {
        renderVariations(variationsEditor, [defaultVariation()])
      }
      return
    }

    if (event.target.matches("[data-add-option]")) {
      const optionsRoot = qs(block, "[data-options-root]")
      const index = qsa(optionsRoot, "[data-option-index]").length
      optionsRoot.insertAdjacentHTML(
        "beforeend",
        `<div class="admin-option-row" data-option-index="${index}">
          <input type="text" data-option-field="label" placeholder="Opção" required>
          <input type="number" data-option-field="price_fitc_override" placeholder="FITC" min="0">
          <input type="file" accept="image/jpeg,image/png,image/webp" data-option-field="image_file" hidden>
          <button type="button" class="admin-text-link" data-option-image-btn title="Adicionar imagem">📷</button>
          <button type="button" class="admin-danger-link" data-remove-option>×</button>
        </div>`
      )
      return
    }

    if (event.target.matches("[data-remove-option]")) {
      event.target.closest("[data-option-index]")?.remove()
    }

    // Option image button
    if (event.target.closest("[data-option-image-btn]")) {
      const row = event.target.closest("[data-option-index]")
      const fileInput = qs(row, '[data-option-field="image_file"]')
      fileInput?.click()
    }
  })

  // Option image file change
  variationsEditor?.addEventListener("change", (event) => {
    if (event.target.matches('[data-option-field="image_file"]')) {
      const file = event.target.files[0]
      const row = event.target.closest("[data-option-index]")
      if (!row) return

      const existingThumb = qs(row, ".variation-option-thumb")
      existingThumb?.remove()

      if (file) {
        const url = URL.createObjectURL(file)
        const thumb = document.createElement("img")
        thumb.className = "variation-option-thumb"
        thumb.src = url
        thumb.alt = ""
        thumb.style.cssText = "width:36px;height:36px;border-radius:6px;object-fit:cover;margin-top:4px;"
        event.target.parentElement?.appendChild(thumb)
      }
    }
  })

  root.querySelector("[data-add-variation]")?.addEventListener("click", () => {
    const current = readVariations(variationsEditor)
    current.push(defaultVariation())
    renderVariations(variationsEditor, current)
  })

  // Variation preset apply
  root.querySelector("#applyVariationPresetBtn")?.addEventListener("click", async () => {
    const select = root.querySelector("#variationPresetSelect")
    if (!select?.value) return

    try {
      const response = await fetch(`/admin/configuracoes/variacoes/${select.value}`, {
        headers: { Accept: "application/json" }
      })
      if (!response.ok) return
      const preset = await response.json()
      const current = readVariations(variationsEditor)
      current.push({
        name: preset.name,
        unit: preset.unit || "",
        required: preset.required,
        allow_option_image: preset.allow_option_image || false,
        options: (preset.options || []).map((opt) => ({
          label: typeof opt === "string" ? opt : opt.label || "",
          price_fitc_override: typeof opt === "object" ? opt.price_fitc_override : null,
          image_url: typeof opt === "object" ? opt.image_url : null,
        }))
      })
      renderVariations(variationsEditor, current)
    } catch {
      // silent fail
    }
  })

  // Sync variations JSON on submit
  form?.addEventListener("submit", () => {
    const input = qs(form, 'input[name="variations_json"]')
    if (input && variationsEditor) {
      input.value = JSON.stringify(readVariations(variationsEditor))
    }
  })

  if (variationsEditor && !qsa(variationsEditor, "[data-variation-index]").length) {
    renderVariations(variationsEditor, [defaultVariation()])
  }

  // URL params: auto-open modal on page load
  const { modal, editId } = parseModalParams()
  if (modal === "create" && form) {
    title.textContent = "Novo produto"
    resetProductForm(form)
    openOverlay(overlay)
  } else if (modal === "edit" && editId && form) {
    title.textContent = "Editar produto"
    loadProductData(form, editId).then((data) => {
      fillProductForm(form, data)
      openOverlay(overlay)
    }).catch(() => {})
  }
}

export function teardownAdminProducts() {
  closeOverlay(document.getElementById("admin-product-modal"))
}
