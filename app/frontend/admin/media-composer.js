export function initMediaComposer(root = document) {
  root.querySelectorAll("[data-media-composer]").forEach((composer) => {
    const dropzone = composer.querySelector("[data-composer-dropzone]")
    const fileInput = composer.querySelector("[data-composer-file]")
    const preview = composer.querySelector("[data-composer-preview]")
    const previewImg = composer.querySelector("[data-composer-preview-img]")
    const changeBtn = composer.querySelector("[data-composer-change]")
    const removeBtn = composer.querySelector("[data-composer-remove]")

    if (!dropzone || !fileInput) return

    let currentUrl = ""

    function showPreview(url) {
      if (!preview || !previewImg) return
      currentUrl = url
      previewImg.src = url
      preview.hidden = false
      dropzone.hidden = true
      composer.dispatchEvent(new CustomEvent("composer:update", { detail: { url } }))
    }

    function clearPreview() {
      if (!preview || !previewImg) return
      currentUrl = ""
      previewImg.src = ""
      preview.hidden = true
      dropzone.hidden = false
      fileInput.value = ""
      composer.dispatchEvent(new CustomEvent("composer:update", { detail: { url: "" } }))
    }

    function handleFile(file) {
      if (!file || !file.type.startsWith("image/")) return
      const url = URL.createObjectURL(file)
      showPreview(url)
    }

    dropzone.addEventListener("click", () => fileInput.click())

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault()
      dropzone.classList.add("is-dragover")
    })

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("is-dragover")
    })

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault()
      dropzone.classList.remove("is-dragover")
      const file = e.dataTransfer.files[0]
      handleFile(file)
    })

    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0]
      handleFile(file)
    })

    changeBtn?.addEventListener("click", () => fileInput.click())
    removeBtn?.addEventListener("click", clearPreview)

    composer._api = {
      setImageUrl(url) {
        if (url) showPreview(url)
        else clearPreview()
      },
      clear: clearPreview,
      getPreviewSrc: () => currentUrl,
    }
  })
}

export function bindVariationImagePreview(fileInput) {
  if (!fileInput || fileInput._bound) return
  fileInput._bound = true

  const container = fileInput.closest(".admin-option-row") || fileInput.parentElement
  const existingThumb = container?.querySelector(".variation-option-thumb")

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0]
    if (existingThumb) existingThumb.remove()

    if (!file) return

    const url = URL.createObjectURL(file)
    const thumb = document.createElement("img")
    thumb.className = "variation-option-thumb"
    thumb.src = url
    thumb.alt = ""
    thumb.style.cssText = "width:40px;height:40px;border-radius:6px;object-fit:cover;margin-top:4px;"
    fileInput.parentElement?.appendChild(thumb)
  })
}

export function bindAllVariationImagePreviews(container) {
  if (!container) return
  container.querySelectorAll('input[type="file"]').forEach(bindVariationImagePreview)
}
