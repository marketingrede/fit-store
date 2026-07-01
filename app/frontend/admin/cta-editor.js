function updatePreview(root) {
  const preview = root.querySelector("[data-cta-preview-card]")
  if (!preview) return

  const title = root.querySelector("#catalog_cta_card_title")?.value || "Título do card"
  const body = root.querySelector("#catalog_cta_card_body")?.value || "Texto de apoio do CTA."
  const linkLabel = root.querySelector("#catalog_cta_card_link_label")?.value || "Saiba mais"
  const variant = root.querySelector('input[name="catalog_cta_card[variant]"]:checked')?.value ||
    root.querySelector("#catalog_cta_card_variant")?.value || "teal"

  const imgPreview = root.querySelector("[data-cta-image-preview]")
  const imageUrl = imgPreview?.querySelector("img")?.src || ""

  preview.className = `admin-cta-preview-card admin-cta-preview-card--${variant}`

  let html = `<h3>${title}</h3><p>${body}</p>`
  if (imageUrl) {
    html = `<img src="${imageUrl}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:10px;">` + html
  }
  html += `<a href="#">${linkLabel}</a>`

  preview.innerHTML = html
}

function bindActiveToggle(root) {
  const toggle = root.querySelector("[data-cta-active-toggle]")
  if (!toggle) return

  const track = toggle.querySelector(".admin-toggle__track")
  const input = toggle.querySelector('input[type="checkbox"]')
  const cardId = root.dataset.ctaCardId
  const saveStatus = root.querySelector("[data-cta-save-status]")

  input?.addEventListener("change", async () => {
    const active = input.checked ? "1" : "0"

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
      const response = await fetch(`/admin/configuracoes/ctas/${cardId}/ativo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRF-Token": csrfToken || "",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: `active=${active}`,
      })

      if (response.ok) {
        const preview = root.querySelector("[data-cta-preview-card]")
        if (preview) {
          preview.classList.toggle("admin-cta-preview--inactive", !input.checked)
        }
        if (saveStatus) {
          saveStatus.textContent = "Salvo!"
          saveStatus.style.display = ""
          setTimeout(() => {
            saveStatus.style.display = "none"
          }, 3200)
        }
      }
    } catch {
      // Revert on error
      input.checked = !input.checked
    }
  })
}

function bindImagePreview(root) {
  const fileInput = root.querySelector("[data-cta-image-input]")
  const previewContainer = root.querySelector("[data-cta-image-preview]")
  if (!fileInput || !previewContainer) return

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0]
    if (!file) {
      previewContainer.innerHTML = ""
      return
    }

    const url = URL.createObjectURL(file)
    previewContainer.innerHTML = `<img src="${url}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:8px;">`
    updatePreview(root)
  })
}

function bindVariantRadios(root) {
  root.querySelectorAll('input[name="catalog_cta_card[variant]"]').forEach((radio) => {
    radio.addEventListener("change", () => updatePreview(root))
  })
}

export function initCtaEditor() {
  document.querySelectorAll("[data-cta-editor]").forEach((root) => {
    root.addEventListener("input", () => updatePreview(root))
    bindActiveToggle(root)
    bindImagePreview(root)
    bindVariantRadios(root)
    updatePreview(root)
  })
}
