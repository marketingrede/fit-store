(function () {
  "use strict"

  const chartInstances = []

  function qs(root, selector) {
    return (root || document).querySelector(selector)
  }

  function qsa(root, selector) {
    return Array.from((root || document).querySelectorAll(selector))
  }

  function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content
  }

  function openOverlay(overlay) {
    if (!overlay) return
    overlay.classList.add("is-open")
    overlay.setAttribute("aria-hidden", "false")
    document.body.classList.add("is-admin-sidebar-open")
  }

  function closeOverlay(overlay) {
    if (!overlay) return
    overlay.classList.remove("is-open")
    overlay.setAttribute("aria-hidden", "true")
    if (!document.querySelector(".admin-overlay.is-open")) {
      document.body.classList.remove("is-admin-sidebar-open")
    }
  }

  function defaultVariation() {
    return {
      name: "",
      unit: "",
      required: true,
      allow_option_image: false,
      options: [{ label: "", price_fitc_override: "", image_url: "" }],
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;")
  }

  function renderVariations(container, variations) {
    if (!container) return

    const rows = variations?.length ? variations : [defaultVariation()]

    container.innerHTML = rows
      .map((variation, index) => {
        const options = variation.options?.length
          ? variation.options
          : [{ label: "", price_fitc_override: "", image_url: "" }]

        return `
          <div class="admin-variation-block" data-variation-index="${index}">
            <div class="admin-variation-block__header">
              <strong>Variação ${index + 1}</strong>
              <button type="button" class="admin-danger-link" data-remove-variation>Remover</button>
            </div>
            <div class="admin-form-grid admin-form-grid--2">
              <div>
                <label>Nome</label>
                <input type="text" data-field="name" value="${escapeHtml(variation.name)}" required>
              </div>
              <div>
                <label>Unidade</label>
                <input type="text" data-field="unit" value="${escapeHtml(variation.unit)}">
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
                  <input type="text" data-option-field="label" value="${escapeHtml(option.label)}" placeholder="Opção" required>
                  <input type="number" data-option-field="price_fitc_override" value="${escapeHtml(option.price_fitc_override ?? "")}" placeholder="FITC" min="0">
                  <button type="button" class="admin-danger-link" data-remove-option>×</button>
                </div>`
                )
                .join("")}
            </div>
            <button type="button" class="admin-text-link" data-add-option>+ opção</button>
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
        image_url: null,
      })),
    }))
  }

  function updateMediaPreview(form, url) {
    const preview = qs(form, "[data-product-media-preview]")
    if (!preview) return

    if (url) {
      preview.innerHTML = `<img src="${escapeHtml(url)}" alt="">`
    } else {
      preview.innerHTML = `<span class="admin-empty-text">Sem imagem</span>`
    }
  }

  function bindVariationsEditor(scope) {
    const editor = qs(scope, "[data-variations-editor]")
    if (!editor || editor.dataset.bound === "true") return

    editor.dataset.bound = "true"

    const initial = scope.dataset.initialVariations
    if (initial) {
      try {
        renderVariations(editor, JSON.parse(initial))
      } catch {
        renderVariations(editor, [defaultVariation()])
      }
    } else if (!qsa(editor, "[data-variation-index]").length) {
      renderVariations(editor, [defaultVariation()])
    }

    scope.addEventListener("click", (event) => {
      if (event.target.matches("[data-add-variation]")) {
        const current = readVariations(editor)
        current.push(defaultVariation())
        renderVariations(editor, current)
        return
      }

      const block = event.target.closest("[data-variation-index]")
      if (!block || !editor.contains(block)) return

      if (event.target.matches("[data-remove-variation]")) {
        block.remove()
        if (!qsa(editor, "[data-variation-index]").length) {
          renderVariations(editor, [defaultVariation()])
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
            <button type="button" class="admin-danger-link" data-remove-option>×</button>
          </div>`
        )
        return
      }

      if (event.target.matches("[data-remove-option]")) {
        event.target.closest("[data-option-index]")?.remove()
      }
    })

    const form = scope.tagName === "FORM" ? scope : scope.closest("form")
    form?.addEventListener("submit", () => {
      const input = qs(form, 'input[name="variations_json"]')
      if (input) input.value = JSON.stringify(readVariations(editor))
    })

    form?.addEventListener("input", (event) => {
      if (event.target.id === "product_image_url") {
        updateMediaPreview(form, event.target.value)
      }
    })
  }

  function formDataUrl(template, id) {
    return template.replace(":id", id)
  }

  async function loadProductData(template, productId) {
    const response = await fetch(formDataUrl(template, productId), {
      headers: {
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      credentials: "same-origin",
    })
    if (!response.ok) throw new Error("Falha ao carregar produto")
    return response.json()
  }

  function fillProductForm(form, createUrl, data) {
    form.action = `${createUrl}/${data.id}`
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

  function resetProductForm(form, createUrl) {
    form.action = createUrl
    form.method = "post"
    qs(form, 'input[name="_method"]')?.remove()
    form.reset()
    qs(form, "#product_active").checked = true
    updateMediaPreview(form, "")
    renderVariations(qs(form, "[data-variations-editor]"), [defaultVariation()])
  }

  function initAdminShell() {
    const shell = document.querySelector("[data-admin-shell]")
    if (!shell) return

    const toggle = () => {
      shell.classList.toggle("is-nav-open")
      document.body.classList.toggle("is-admin-sidebar-open", shell.classList.contains("is-nav-open"))
    }

    const close = () => {
      shell.classList.remove("is-nav-open")
      document.body.classList.remove("is-admin-sidebar-open")
    }

    qsa(shell, "[data-admin-nav-toggle]").forEach((button) => {
      button.addEventListener("click", toggle)
    })

    qsa(shell, ".admin-nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 920px)").matches) close()
      })
    })

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close()
    })
  }

  function initAdminProducts() {
    qsa(document, "[data-product-form]").forEach((form) => bindVariationsEditor(form))

    const root = document.querySelector("[data-admin-products]")
    const overlay = document.getElementById("admin-product-modal")
    if (!root && !overlay) return

    const form = overlay ? qs(overlay, "form") : null
    const title = overlay ? qs(overlay, "[data-product-modal-title]") : null
    const createUrl = root?.dataset.createUrl || overlay?.dataset.createUrl
    const formDataTemplate = root?.dataset.formDataUrl || overlay?.dataset.formDataUrl

    if (form) bindVariationsEditor(form)

    const bulkBar = root?.querySelector(".admin-bulk-bar")
    const bulkForm = root?.querySelector("[data-bulk-form]")
    const selectAll = root?.querySelector("[data-select-all-products]")

    const refreshBulkBar = () => {
      if (!root) return
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

    root?.addEventListener("change", (event) => {
      if (event.target.matches("[data-product-select]")) refreshBulkBar()
    })

    root?.querySelector("[data-open-product-modal]")?.addEventListener("click", () => {
      if (!form || !createUrl) return
      if (title) title.textContent = "Novo produto"
      resetProductForm(form, createUrl)
      openOverlay(overlay)
    })

    root &&
      qsa(root, "[data-edit-product]").forEach((button) => {
        button.addEventListener("click", async () => {
          if (!form || !createUrl || !formDataTemplate) return
          const productId = button.dataset.editProduct
          if (title) title.textContent = "Editar produto"
          try {
            const data = await loadProductData(formDataTemplate, productId)
            fillProductForm(form, createUrl, data)
            openOverlay(overlay)
          } catch {
            window.location.href = `${createUrl}/${productId}/edit`
          }
        })
      })

    overlay &&
      qsa(overlay, "[data-close-modal]").forEach((button) => {
        button.addEventListener("click", () => closeOverlay(overlay))
      })

    overlay?.addEventListener("click", (event) => {
      if (event.target === overlay) closeOverlay(overlay)
    })
  }

  function initBalanceModal() {
    const overlay = document.getElementById("admin-balance-modal")
    if (!overlay) return

    const form = overlay.querySelector("form")
    const employeeSelect = form?.querySelector('select[name="employee_id"]')
    const title = overlay.querySelector("[data-balance-modal-title]")

    const open = (employeeId, employeeName) => {
      if (employeeSelect && employeeId) employeeSelect.value = employeeId
      if (title && employeeName) title.textContent = `Ajustar saldo — ${employeeName}`
      openOverlay(overlay)
    }

    qsa(document, "[data-open-balance-modal]").forEach((button) => {
      button.addEventListener("click", () => {
        open(button.dataset.employeeId, button.dataset.employeeName)
      })
    })

    qsa(overlay, "[data-close-modal]").forEach((button) => {
      button.addEventListener("click", () => closeOverlay(overlay))
    })

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeOverlay(overlay)
    })
  }

  function initColorPickers() {
    qsa(document, "[data-color-picker]").forEach((wrapper) => {
      if (wrapper.dataset.bound === "true") return
      wrapper.dataset.bound = "true"

      const colorInput = wrapper.querySelector('input[type="color"]')
      const textInput = wrapper.querySelector('input[type="text"]')
      if (!colorInput || !textInput) return

      colorInput.addEventListener("input", () => {
        textInput.value = colorInput.value
      })

      textInput.addEventListener("input", () => {
        const value = textInput.value.trim()
        if (/^#[0-9a-fA-F]{6}$/.test(value)) colorInput.value = value
      })

      if (/^#[0-9a-fA-F]{6}$/.test(textInput.value.trim())) {
        colorInput.value = textInput.value.trim()
      }
    })
  }

  function initCtaEditor() {
    const root = document.querySelector("[data-cta-editor]")
    if (!root) return

    const preview = root.querySelector("[data-cta-preview-card]")
    const update = () => {
      if (!preview) return
      const title = root.querySelector("#catalog_cta_card_title")?.value || "Título do card"
      const body = root.querySelector("#catalog_cta_card_body")?.value || "Texto de apoio do CTA."
      const linkLabel = root.querySelector("#catalog_cta_card_link_label")?.value || "Saiba mais"
      const variant = root.querySelector("#catalog_cta_card_variant")?.value || "teal"

      preview.className = `admin-cta-preview-card admin-cta-preview-card--${variant}`
      preview.innerHTML = `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p><a href="#">${escapeHtml(linkLabel)}</a>`
    }

    root.addEventListener("input", update)
    update()
  }

  function initAnnouncementEditor() {
    const root = document.querySelector("[data-announcement-editor]")
    const mount = root?.querySelector("[data-quill-mount]")
    const hidden = root?.querySelector('[name="announcement[content_html]"]')
    if (!mount || !hidden || typeof window.Quill !== "function") return

    const editor = new window.Quill(mount, {
      theme: "snow",
      modules: {
        toolbar: [
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link"],
          ["clean"],
        ],
      },
    })

    if (hidden.value) editor.root.innerHTML = hidden.value

    root.closest("form")?.addEventListener("submit", () => {
      hidden.value = editor.root.innerHTML
    })
  }

  let announcementCropper = null

  function destroyAnnouncementCropper() {
    announcementCropper?.destroy()
    announcementCropper = null
  }

  function initAnnouncementCropper() {
    destroyAnnouncementCropper()

    const root = document.querySelector("[data-announcement-image-editor]")
    if (!root || typeof window.Cropper !== "function") return

    const input = root.querySelector("[data-announcement-image-input]")
    const stage = root.querySelector("[data-announcement-crop-stage]")
    const image = root.querySelector("[data-announcement-crop-image]")
    const preview = root.querySelector("[data-announcement-image-preview]")
    const applyButton = root.querySelector("[data-announcement-crop-apply]")
    if (!input || !stage || !image || !applyButton) return

    const showPreview = (url) => {
      if (!preview || !url) return
      preview.hidden = false
      preview.innerHTML = `<img src="${url}" alt="">`
    }

    const loadImage = (url) => {
      if (!url) {
        stage.hidden = true
        applyButton.hidden = true
        destroyAnnouncementCropper()
        return
      }

      stage.hidden = false
      applyButton.hidden = false
      image.src = url
      image.onload = () => {
        destroyAnnouncementCropper()
        announcementCropper = new window.Cropper(image, {
          aspectRatio: 16 / 9,
          viewMode: 1,
          autoCropArea: 1,
        })
      }
    }

    input.addEventListener("change", () => loadImage(input.value.trim()))
    if (input.value.trim()) loadImage(input.value.trim())

    applyButton.addEventListener("click", () => {
      if (!announcementCropper) return
      const canvas = announcementCropper.getCroppedCanvas({ width: 1200, imageSmoothingQuality: "high" })
      if (!canvas) return
      input.value = canvas.toDataURL("image/jpeg", 0.92)
      showPreview(input.value)
    })
  }

  function destroyCharts() {
    while (chartInstances.length) chartInstances.pop()?.destroy()
  }

  function initDashboardCharts() {
    if (typeof window.Chart !== "function") return

    const root = document.getElementById("admin-dashboard-charts")
    if (!root?.dataset.charts) return

    let payload
    try {
      payload = JSON.parse(root.dataset.charts)
    } catch {
      return
    }

    const brand = { teal: "#2dbda8", tealSoft: "rgba(45, 189, 168, 0.14)", muted: "#8a9199", text: "#303238" }
    const colors = ["#2dbda8", "#256897", "#1e9a88", "#326f91", "#62c7ba", "#4f9fd0", "#8f9499", "#d8dde2"]

    const basePlugins = {
      legend: { labels: { color: brand.muted, font: { size: 11, weight: "600" } } },
      tooltip: { backgroundColor: "#2d3035", padding: 10, cornerRadius: 8 },
    }

    const tradeCanvas = document.getElementById("admin-chart-trade-days")
    if (tradeCanvas && payload.tradeDays?.length) {
      chartInstances.push(
        new window.Chart(tradeCanvas, {
          type: "line",
          data: {
            labels: payload.tradeDays.map((d) => d.label),
            datasets: [{
              label: "Trocas",
              data: payload.tradeDays.map((d) => d.value),
              borderColor: brand.teal,
              backgroundColor: brand.tealSoft,
              fill: true,
              tension: 0.35,
              borderWidth: 2,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: basePlugins.tooltip },
            scales: {
              x: { grid: { display: false }, ticks: { color: brand.muted, maxTicksLimit: 8 } },
              y: { beginAtZero: true, ticks: { color: brand.muted, precision: 0 }, grid: { color: "#edf0f2" } },
            },
          },
        })
      )
    }

    const topCanvas = document.getElementById("admin-chart-top-products")
    if (topCanvas && payload.topProducts?.length) {
      chartInstances.push(
        new window.Chart(topCanvas, {
          type: "bar",
          data: {
            labels: payload.topProducts.map((d) => d.name),
            datasets: [{ data: payload.topProducts.map((d) => d.value), backgroundColor: brand.teal, borderRadius: 999, barThickness: 12 }],
          },
          options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: basePlugins.tooltip },
            scales: {
              x: { beginAtZero: true, ticks: { color: brand.muted, precision: 0 }, grid: { color: "#edf0f2" } },
              y: { grid: { display: false }, ticks: { color: brand.text, font: { weight: "600" } } },
            },
          },
        })
      )
    }

    const doughnut = (canvas, items, cutout) => {
      if (!canvas || !items?.length) return
      chartInstances.push(
        new window.Chart(canvas, {
          type: "doughnut",
          data: {
            labels: items.map((i) => i.label),
            datasets: [{
              data: items.map((i) => i.value),
              backgroundColor: items.map((i, idx) => i.color || colors[idx % colors.length]),
              borderWidth: 0,
            }],
          },
          options: {
            cutout,
            responsive: true,
            maintainAspectRatio: false,
            plugins: { ...basePlugins, legend: { ...basePlugins.legend, position: "bottom" } },
          },
        })
      )
    }

    doughnut(document.getElementById("admin-chart-categories"), payload.categories, "68%")
    doughnut(document.getElementById("admin-chart-catalog-status"), payload.catalogStatus, "72%")
  }

  function boot() {
    destroyCharts()
    initAdminShell()
    initAdminProducts()
    initBalanceModal()
    initColorPickers()
    initCtaEditor()
    initAnnouncementEditor()
    initAnnouncementCropper()
    initDashboardCharts()
  }

  document.addEventListener("DOMContentLoaded", boot)
  document.addEventListener("turbo:load", boot)
  document.addEventListener("turbo:before-cache", () => {
    destroyCharts()
    destroyAnnouncementCropper()
  })
})()
