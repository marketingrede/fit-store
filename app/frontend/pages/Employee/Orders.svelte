<script>
  import { Link } from "@inertiajs/svelte"

  let { orders = [] } = $props()

  function formatDate(value) {
    if (!value) return "—"
    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function statusLabel(status) {
    const labels = {
      confirmed: "Confirmado",
      reversed: "Estornado",
      pending: "Pendente",
    }
    return labels[status] || status
  }
</script>

<svelte:head>
  <title>Resgates | Colaborador Movimenta+</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
  <nav class="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3">
    <div class="mx-auto flex max-w-3xl items-center justify-between">
      <span class="text-sm font-semibold text-slate-900">Colaborador</span>
      <div class="flex items-center gap-4 text-sm">
        <Link href="/colaborador/perfil" class="text-slate-600 hover:text-teal">Perfil</Link>
        <Link href="/colaborador/extrato" class="text-slate-600 hover:text-teal">Extrato</Link>
        <Link href="/colaborador/resgates" class="font-medium text-teal">Resgates</Link>
        <Link href="/colaborador/catalogo" class="text-slate-600 hover:text-teal">Catálogo</Link>
      </div>
    </div>
  </nav>

  <main class="mx-auto max-w-3xl px-4 py-8">
    <h1 class="mb-6 text-xl font-bold text-slate-900">Meus resgates</h1>

    {#if orders.length === 0}
      <p class="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-500">
        Você ainda não realizou resgates.
      </p>
    {:else}
      <ul class="space-y-3">
        {#each orders as order (order.id)}
          <li class="rounded-xl border border-slate-200 bg-white p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-slate-900">{order.product_name}</p>
                <p class="mt-1 text-sm text-slate-500">{formatDate(order.created_at)}</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-teal">{order.product_price_fitc} FITC</p>
                <p class="mt-1 text-xs text-slate-500">{statusLabel(order.status)}</p>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </main>
</div>
