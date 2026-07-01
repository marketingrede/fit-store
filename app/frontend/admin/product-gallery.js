export function initProductImageGallery() {
  const lightbox = document.getElementById("productImageLightbox")
  if (!lightbox) return

  const lightboxImg = lightbox.querySelector("[data-lightbox-img]")
  const lightboxCounter = lightbox.querySelector("[data-lightbox-counter]")
  const prevBtn = lightbox.querySelector("[data-lightbox-prev]")
  const nextBtn = lightbox.querySelector("[data-lightbox-next]")
  const closeBtn = lightbox.querySelector("[data-lightbox-close]")

  let images = []
  let currentIndex = 0

  function collectImages() {
    const collected = []

    // Main composer image
    const composer = document.querySelector("[data-media-composer]")
    if (composer) {
      const previewImg = composer.querySelector("[data-composer-preview-img]")
      if (previewImg?.src) collected.push({ src: previewImg.src, label: "Produto" })
    }

    // Fallback: media preview
    if (!collected.length) {
      const preview = document.querySelector("[data-product-media-preview] img")
      if (preview?.src) collected.push({ src: preview.src, label: "Produto" })
    }

    // Variation option images
    document.querySelectorAll(".variation-option-thumb").forEach((thumb) => {
      if (thumb.src) collected.push({ src: thumb.src, label: "Variação" })
    })

    return collected
  }

  function showImage(index) {
    if (!images.length) return
    currentIndex = ((index % images.length) + images.length) % images.length
    const img = images[currentIndex]
    if (lightboxImg) {
      lightboxImg.src = img.src
      lightboxImg.alt = img.label
    }
    if (lightboxCounter) {
      lightboxCounter.textContent = `${currentIndex + 1} / ${images.length}`
    }
    prevBtn.style.display = images.length > 1 ? "" : "none"
    nextBtn.style.display = images.length > 1 ? "" : "none"
  }

  function openLightbox(startIndex = 0) {
    images = collectImages()
    if (!images.length) return
    showImage(startIndex)
    lightbox.classList.add("is-open")
    lightbox.setAttribute("aria-hidden", "false")
    document.body.style.overflow = "hidden"
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open")
    lightbox.setAttribute("aria-hidden", "true")
    document.body.style.overflow = ""
  }

  // Click on preview images to open lightbox
  document.addEventListener("click", (event) => {
    // Main composer image click
    const composerImg = event.target.closest("[data-composer-preview-img]")
    if (composerImg) {
      openLightbox(0)
      return
    }

    // Product media preview image
    const mediaPreviewImg = event.target.closest("[data-product-media-preview] img")
    if (mediaPreviewImg) {
      openLightbox(0)
      return
    }

    // Variation thumbnail
    const thumb = event.target.closest(".variation-option-thumb")
    if (thumb) {
      const allThumbs = Array.from(document.querySelectorAll(".variation-option-thumb"))
      const thumbIndex = allThumbs.indexOf(thumb) + 1 // +1 because main image is index 0
      openLightbox(thumbIndex)
      return
    }
  })

  closeBtn?.addEventListener("click", closeLightbox)
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox()
  })

  prevBtn?.addEventListener("click", () => showImage(currentIndex - 1))
  nextBtn?.addEventListener("click", () => showImage(currentIndex + 1))

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return
    if (event.key === "Escape") closeLightbox()
    if (event.key === "ArrowLeft") showImage(currentIndex - 1)
    if (event.key === "ArrowRight") showImage(currentIndex + 1)
  })
}
