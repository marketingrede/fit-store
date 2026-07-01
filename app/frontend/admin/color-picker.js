function hsvToRgb(h, s, v) {
  let r, g, b
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h, s, v }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null
}

export function initColorPickers(scope = document) {
  scope.querySelectorAll("[data-color-picker-widget]").forEach((wrapper) => {
    if (wrapper._pickerInit) return
    wrapper._pickerInit = true

    const triggerBtn = wrapper.querySelector("[data-color-trigger]")
    const hexInput = wrapper.querySelector("[data-color-hex]")
    const nativeInput = wrapper.querySelector('input[type="color"]')
    const swatch = wrapper.querySelector("[data-color-swatch]")
    const previewTarget = wrapper.querySelector("[data-color-preview]")

    let hsv = { h: 0, s: 1, v: 1 }
    let isOpen = false

    // Build popover
    const popover = document.createElement("div")
    popover.className = "admin-color-picker__popover"
    popover.innerHTML = `
      <div class="admin-color-picker__sv" data-sv-area>
        <div class="admin-color-picker__sv-cursor" data-sv-cursor></div>
      </div>
      <div class="admin-color-picker__hue" data-hue-slider>
        <div class="admin-color-picker__hue-thumb" data-hue-thumb></div>
      </div>
    `
    wrapper.appendChild(popover)

    const svArea = popover.querySelector("[data-sv-area]")
    const svCursor = popover.querySelector("[data-sv-cursor]")
    const hueSlider = popover.querySelector("[data-hue-slider]")
    const hueThumb = popover.querySelector("[data-hue-thumb]")

    function updateFromHsv() {
      const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v)
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b)

      if (hexInput) hexInput.value = hex
      if (nativeInput) nativeInput.value = hex
      if (swatch) swatch.style.background = hex
      if (previewTarget) previewTarget.style.setProperty("--tag-color", hex)

      // Update SV area background
      const pureHue = hsvToRgb(hsv.h, 1, 1)
      svArea.style.background = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, rgb(${pureHue.r},${pureHue.g},${pureHue.b}))`

      // Update cursor position
      svCursor.style.left = `${hsv.s * 100}%`
      svCursor.style.bottom = `${hsv.v * 100}%`

      // Update hue thumb
      hueThumb.style.left = `${hsv.h * 100}%`

      wrapper.dispatchEvent(new CustomEvent("colorchange", { detail: { hex, hsv: { ...hsv } } }))
    }

    function setFromHex(hex) {
      const rgb = hexToRgb(hex)
      if (!rgb) return
      hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
      updateFromHsv()
    }

    // SV area interaction
    let svDragging = false

    function handleSvEvent(e) {
      const rect = svArea.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))
      hsv.s = x
      hsv.v = y
      updateFromHsv()
    }

    svArea.addEventListener("mousedown", (e) => {
      svDragging = true
      handleSvEvent(e)
    })

    // Hue slider interaction
    let hueDragging = false

    function handleHueEvent(e) {
      const rect = hueSlider.getBoundingClientRect()
      hsv.h = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      updateFromHsv()
    }

    hueSlider.addEventListener("mousedown", (e) => {
      hueDragging = true
      handleHueEvent(e)
    })

    document.addEventListener("mousemove", (e) => {
      if (svDragging) handleSvEvent(e)
      if (hueDragging) handleHueEvent(e)
    })

    document.addEventListener("mouseup", () => {
      svDragging = false
      hueDragging = false
    })

    // Hex input
    hexInput?.addEventListener("input", () => {
      const val = hexInput.value.trim()
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        setFromHex(val)
      }
    })

    // Native color input
    nativeInput?.addEventListener("input", () => {
      setFromHex(nativeInput.value)
    })

    // Trigger button
    triggerBtn?.addEventListener("click", () => {
      isOpen = !isOpen
      popover.style.display = isOpen ? "block" : "none"
      if (isOpen) updateFromHsv()
    })

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (isOpen && !wrapper.contains(e.target)) {
        isOpen = false
        popover.style.display = "none"
      }
    })

    // Init from current value
    const initial = hexInput?.value || nativeInput?.value || "#2dbda8"
    setFromHex(initial)
  })
}
