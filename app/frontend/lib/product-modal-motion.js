import { animate } from "motion"
import { isMobileModal, prefersReducedMotion } from "./motion-prefs.js"

export const DESKTOP_GRID = {
  collapsed: "minmax(0, 1fr) minmax(0, 1.05fr)",
  expanded: "minmax(0, 1.35fr) minmax(280px, 0.75fr)",
}

export const MOBILE_GRID = {
  collapsed: "minmax(200px, 46%) auto",
  expanded: "minmax(260px, 68%) auto",
}

export function animateModalIn(panel) {
  if (!panel || prefersReducedMotion()) return Promise.resolve()

  return animate(
    panel,
    {
      opacity: [0, 1],
      scale: [0.96, 1],
      y: [isMobileModal() ? 28 : 12, 0],
    },
    { duration: 0.48, easing: [0.22, 1, 0.36, 1] },
  ).finished
}

export function animateModalOut(panel) {
  if (!panel || prefersReducedMotion()) return Promise.resolve()

  return animate(
    panel,
    {
      opacity: [1, 0],
      scale: [1, 0.97],
      y: [0, isMobileModal() ? 18 : 8],
    },
    { duration: 0.32, easing: [0.4, 0, 0.2, 1] },
  ).finished
}

export function animateBackdropIn(backdrop) {
  if (!backdrop || prefersReducedMotion()) return Promise.resolve()

  return animate(backdrop, { opacity: [0, 1] }, { duration: 0.32, easing: [0.22, 1, 0.36, 1] }).finished
}

export function animateBackdropOut(backdrop) {
  if (!backdrop || prefersReducedMotion()) return Promise.resolve()

  return animate(backdrop, { opacity: [1, 0] }, { duration: 0.28, easing: [0.4, 0, 0.2, 1] }).finished
}

function clearSlideMotionStyles(card) {
  if (!card) return

  card.style.opacity = ""
  card.style.transform = ""
}

function clearCardMotionStyles(card) {
  card.classList.remove("is-media-expanded")
  card.style.gridTemplateColumns = ""
  card.style.gridTemplateRows = ""
  clearSlideMotionStyles(card)
  card
    .querySelectorAll(
      ".product-modal-card__desc, .product-modal-card__hint, .cta-helper, .product-modal-card__media-badge, .product-modal-card__media img",
    )
    .forEach((element) => {
      element.style.opacity = ""
      element.style.height = ""
      element.style.transform = ""
    })
}

export function resetMediaExpanded(root = document) {
  root.querySelectorAll(".product-modal-card.is-media-expanded").forEach((card) => {
    clearCardMotionStyles(card)
  })
}

export async function setMediaExpanded(card, expand) {
  if (!card) return

  const desc = card.querySelector(".product-modal-card__desc")
  const hint = card.querySelector(".product-modal-card__hint")
  const helper = card.querySelector(".cta-helper")
  const img = card.querySelector(".product-modal-card__media img")
  const badge = card.querySelector(".product-modal-card__media-badge")
  const mobile = isMobileModal()
  const gridKey = mobile ? "gridTemplateRows" : "gridTemplateColumns"
  const grids = mobile ? MOBILE_GRID : DESKTOP_GRID

  if (prefersReducedMotion()) {
    card.classList.toggle("is-media-expanded", expand)
    card.style[gridKey] = expand ? grids.expanded : grids.collapsed
    if (mobile) {
      card.style.gridTemplateColumns = "1fr"
    }
    return
  }

  if (expand) {
    card.classList.add("is-media-expanded")
    if (mobile) {
      card.style.gridTemplateColumns = "1fr"
    }

    if (desc) desc.dataset.fullHeight = String(desc.offsetHeight)
    if (hint) hint.dataset.fullHeight = String(hint.offsetHeight)

    await Promise.all([
      animate(card, { [gridKey]: [grids.collapsed, grids.expanded] }, {
        duration: 0.34,
        easing: [0.22, 1, 0.36, 1],
      }).finished,
      img &&
        animate(img, { scale: [1, 1.03] }, { duration: 0.32, easing: [0.22, 1, 0.36, 1] }).finished,
      desc &&
        animate(desc, { opacity: [1, 0], height: [`${desc.offsetHeight}px`, "0px"] }, {
          duration: 0.24,
          easing: [0.4, 0, 0.2, 1],
        }).finished,
      hint &&
        animate(hint, { opacity: [1, 0], height: [`${hint.offsetHeight}px`, "0px"] }, {
          duration: 0.24,
          easing: [0.4, 0, 0.2, 1],
        }).finished,
      badge &&
        animate(badge, { opacity: [1, 0], y: [0, 4] }, { duration: 0.2, easing: [0.4, 0, 0.2, 1] }).finished,
      helper && animate(helper, { opacity: [1, 0] }, { duration: 0.2, easing: [0.4, 0, 0.2, 1] }).finished,
    ])

    return
  }

  const descHeight = desc?.dataset.fullHeight || (desc ? `${desc.scrollHeight}px` : "0px")
  const hintHeight = hint?.dataset.fullHeight || (hint ? `${hint.scrollHeight}px` : "0px")

  card.style[gridKey] = grids.expanded

  await Promise.all([
    animate(card, { [gridKey]: [grids.expanded, grids.collapsed] }, {
      duration: 0.34,
      easing: [0.22, 1, 0.36, 1],
    }).finished,
    img && animate(img, { scale: [1.03, 1] }, { duration: 0.32, easing: [0.22, 1, 0.36, 1] }).finished,
    desc &&
      animate(desc, { opacity: [0, 1], height: ["0px", descHeight] }, {
        duration: 0.24,
        easing: [0.22, 1, 0.36, 1],
      }).finished,
    hint &&
      animate(hint, { opacity: [0, 1], height: ["0px", hintHeight] }, {
        duration: 0.24,
        easing: [0.22, 1, 0.36, 1],
      }).finished,
    badge && animate(badge, { opacity: [0, 1], y: [4, 0] }, { duration: 0.2, easing: [0.22, 1, 0.36, 1] }).finished,
    helper && animate(helper, { opacity: [0, 1] }, { duration: 0.2, easing: [0.22, 1, 0.36, 1] }).finished,
  ])

  clearCardMotionStyles(card)
}
