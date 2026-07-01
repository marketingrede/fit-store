export function initBalanceModal() {
  const overlay = document.getElementById("admin-balance-modal")
  if (!overlay) return

  const form = overlay.querySelector("form")
  const employeeSelect = form?.querySelector('select[name="employee_id"]')
  const title = overlay.querySelector("[data-balance-modal-title]")

  const open = (employeeId, employeeName) => {
    if (employeeSelect && employeeId) employeeSelect.value = employeeId
    if (title && employeeName) title.textContent = `Ajustar saldo — ${employeeName}`
    overlay.classList.add("is-open")
    document.body.style.overflow = "hidden"
  }

  const close = () => {
    overlay.classList.remove("is-open")
    document.body.style.overflow = ""
  }

  document.querySelectorAll("[data-open-balance-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      open(button.dataset.employeeId, button.dataset.employeeName)
    })
  })

  overlay.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", close)
  })

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close()
  })
}
