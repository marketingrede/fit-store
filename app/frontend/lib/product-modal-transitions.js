import { animate } from "motion"
import { prefersReducedMotion } from "./motion-prefs.js"

/** Duração/easing próximos ao swipe de cartas do Tinder */
const TINDER_SWIPE_DURATION = 0.28
const TINDER_EASE = [0.25, 0.8, 0.25, 1]
/** Rotação só durante o arraste com o dedo (como no app) */
export const TINDER_DRAG_ROTATION = 0.1

function exitDistance(card) {
  const viewport = card?.parentElement
  if (viewport?.offsetWidth) return viewport.offsetWidth + 32
  if (typeof window !== "undefined") return window.innerWidth + 32
  return 420
}

export function clearCardDragStyles(card) {
  if (!card) return

  card.style.transform = ""
  card.style.transition = ""
}

export function applyCardDragTransform(card, deltaX) {
  if (!card) return

  const rotate = deltaX * TINDER_DRAG_ROTATION
  card.style.transform = `translate3d(${deltaX}px, 0, 0) rotate(${rotate}deg)`
}

export function animateCardDragRelease(card, offsetX) {
  if (!card || prefersReducedMotion()) {
    clearCardDragStyles(card)
    return Promise.resolve()
  }

  const rotate = offsetX * TINDER_DRAG_ROTATION

  return animate(
    card,
    {
      x: [offsetX, 0],
      rotate: [rotate, 0],
    },
    { duration: 0.32, easing: TINDER_EASE },
  ).finished.finally(() => {
    clearCardDragStyles(card)
  })
}

/**
 * Transição estilo Tinder: card atual sai 100% na horizontal, só então troca o produto
 * e o próximo entra pela lateral oposta — sem sobreposição, fade ou rotação na troca.
 */
export async function runTinderGalleryTransition(card, direction, fromX = 0, onSwap) {
  if (!card) {
    await onSwap?.()
    return
  }

  if (prefersReducedMotion()) {
    await onSwap?.()
    clearCardDragStyles(card)
    return
  }

  const distance = exitDistance(card)
  const exitTarget = fromX - direction * distance

  clearCardDragStyles(card)
  if (fromX !== 0) {
    card.style.transform = `translate3d(${fromX}px, 0, 0)`
  }

  await animate(
    card,
    { x: [fromX, exitTarget] },
    { duration: TINDER_SWIPE_DURATION, easing: TINDER_EASE },
  ).finished

  clearCardDragStyles(card)
  await onSwap?.()

  const enterStart = direction * distance
  card.style.transform = `translate3d(${enterStart}px, 0, 0)`

  await animate(
    card,
    { x: [enterStart, 0] },
    { duration: TINDER_SWIPE_DURATION, easing: TINDER_EASE },
  ).finished

  clearCardDragStyles(card)
}
