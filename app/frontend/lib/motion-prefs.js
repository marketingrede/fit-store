export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

export function isMobileModal() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches
}
