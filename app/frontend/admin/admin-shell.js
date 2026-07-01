export function initAdminShell() {
  const shell = document.querySelector(".admin-shell")
  if (!shell) return

  const toggleButtons = shell.querySelectorAll("[data-admin-nav-toggle]")
  const backdrop = shell.querySelector(".admin-shell__backdrop")

  const closeNav = () => shell.classList.remove("is-nav-open")
  const openNav = () => shell.classList.add("is-nav-open")
  const toggleNav = () => shell.classList.toggle("is-nav-open")

  toggleButtons.forEach((button) => {
    button.addEventListener("click", toggleNav)
  })

  backdrop?.addEventListener("click", closeNav)

  shell.querySelectorAll(".admin-nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 920px)").matches) closeNav()
    })
  })

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav()
  })
}
