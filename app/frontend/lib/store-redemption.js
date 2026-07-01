import { router } from "@inertiajs/svelte"

export async function submitRedemption({ product, selections, idempotencyKey }) {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content")
  const response = await fetch("/api/colaborador/troca", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    credentials: "same-origin",
    body: JSON.stringify({
      product_id: product.id,
      product_selection: selections,
      idempotency_key: idempotencyKey,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Não foi possível concluir o resgate.")
  }

  router.reload({ preserveScroll: true, preserveState: true })
  return payload
}
