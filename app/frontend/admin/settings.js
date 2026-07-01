function bindColorPickers(root = document) {
  root.querySelectorAll("[data-color-picker]").forEach((wrapper) => {
    const colorInput = wrapper.querySelector('input[type="color"]')
    const textInput = wrapper.querySelector('input[type="text"]')
    if (!colorInput || !textInput) return

    const syncFromColor = () => {
      textInput.value = colorInput.value
    }

    const syncFromText = () => {
      const value = textInput.value.trim()
      if (/^#[0-9a-fA-F]{6}$/.test(value)) colorInput.value = value
    }

    colorInput.addEventListener("input", syncFromColor)
    textInput.addEventListener("input", syncFromText)
    syncFromText()
  })
}

function bindAutoSlug(root = document) {
  root.querySelectorAll("[data-auto-slug]").forEach((input) => {
    const targetSelector = input.dataset.autoSlug
    const target = root.querySelector(targetSelector)
    if (!target) return

    let touched = false

    target.addEventListener("input", () => {
      touched = true
    })

    target.addEventListener("blur", () => {
      touched = false
    })

    input.addEventListener("input", () => {
      if (touched) return
      target.value = input.value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    })
  })
}

function bindTagPreview(root = document) {
  root.querySelectorAll("[data-tag-preview]").forEach((preview) => {
    const wrapper = preview.closest("tr, .admin-form-grid, form")
    if (!wrapper) return

    const nameInput = wrapper.querySelector('input[name*="name"]')
    const colorInput = wrapper.querySelector('input[type="color"], input[data-color-hex]')

    function update() {
      const name = nameInput?.value || "Tag"
      const color = colorInput?.value || "#2dbda8"
      preview.textContent = name
      preview.style.setProperty("--tag-color", color)
    }

    nameInput?.addEventListener("input", update)
    colorInput?.addEventListener("input", update)
    update()
  })
}

function bindOptionsChips(root = document) {
  root.querySelectorAll("[data-options-textarea]").forEach((textarea) => {
    const chipsContainer = textarea.parentElement?.querySelector("[data-options-chips]")
    if (!chipsContainer) return

    function renderChips() {
      const options = textarea.value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)

      chipsContainer.innerHTML = options
        .map((opt) => `<span class="admin-option-chip">${opt}</span>`)
        .join("")
    }

    textarea.addEventListener("input", renderChips)
    renderChips()
  })
}

function bindCollapsibleCards(root = document) {
  root.querySelectorAll("[data-collapse-toggle]").forEach((toggle) => {
    const target = toggle.closest("[data-collapse-card]")
    if (!target) return

    toggle.addEventListener("click", () => {
      const body = target.querySelector("[data-collapse-body]")
      if (!body) return
      const collapsed = body.style.display === "none"
      body.style.display = collapsed ? "" : "none"
      toggle.setAttribute("aria-expanded", String(collapsed))
    })
  })

  const expandAllBtn = root.querySelector("[data-expand-all]")
  const collapseAllBtn = root.querySelector("[data-collapse-all]")

  expandAllBtn?.addEventListener("click", () => {
    root.querySelectorAll("[data-collapse-body]").forEach((body) => {
      body.style.display = ""
    })
    root.querySelectorAll("[data-collapse-toggle]").forEach((toggle) => {
      toggle.setAttribute("aria-expanded", "true")
    })
  })

  collapseAllBtn?.addEventListener("click", () => {
    root.querySelectorAll("[data-collapse-body]").forEach((body) => {
      body.style.display = "none"
    })
    root.querySelectorAll("[data-collapse-toggle]").forEach((toggle) => {
      toggle.setAttribute("aria-expanded", "false")
    })
  })
}

export function initAdminSettings(scope = document) {
  bindColorPickers(scope)
  bindAutoSlug(scope)
  bindTagPreview(scope)
  bindOptionsChips(scope)
  bindCollapsibleCards(scope)
}

export function teardownAdminSettings() {}
