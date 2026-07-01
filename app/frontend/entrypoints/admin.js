import { createIcons, icons } from "lucide"
import { initDashboardCharts, teardownDashboardCharts } from "../admin/dashboard-charts.js"
import { initAdminShell } from "../admin/admin-shell.js"
import { initAdminProducts, teardownAdminProducts } from "../admin/products.js"
import { initBalanceModal } from "../admin/balance-modal.js"
import { initAdminSettings } from "../admin/settings.js"
import { initCtaEditor } from "../admin/cta-editor.js"
import { initAnnouncementEditor, teardownAnnouncementEditor } from "../admin/announcements-editor.js"
import { initMediaComposer } from "../admin/media-composer.js"
import { initProductImageGallery } from "../admin/product-gallery.js"
import { initColorPickers } from "../admin/color-picker.js"

function bootAdmin() {
  teardownDashboardCharts()
  teardownAdminProducts()
  teardownAnnouncementEditor()

  initAdminShell()
  initDashboardCharts()
  initAdminProducts()
  initBalanceModal()
  initAdminSettings()
  initCtaEditor()
  initAnnouncementEditor()
  initMediaComposer()
  initProductImageGallery()
  initColorPickers()

  createIcons({ icons })
}

document.addEventListener("DOMContentLoaded", bootAdmin)
document.addEventListener("turbo:load", bootAdmin)
document.addEventListener("turbo:before-cache", () => {
  teardownDashboardCharts()
  teardownAdminProducts()
  teardownAnnouncementEditor()
})
