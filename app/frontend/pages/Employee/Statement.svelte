<script>
  import { Link } from "@inertiajs/svelte"

  let { entries = [], balanceFitc = 0 } = $props()

  function formatDate(value) {
    if (!value) return "—"
    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }
</script>

<svelte:head>
  <title>Extrato | Colaborador Movimenta+</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
  <nav class="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3">
    <div class="mx-auto flex max-w-3xl items-center justify-between">
      <span class="text-sm font-semibold text-slate-900">Colaborador</span>
      <div class="flex items-center gap-4 text-sm">
        <Link href="/colaborador/perfil" class="text-slate-600 hover:text-teal">Perfil</Link>
        <Link href="/colaborador/extrato" class="font-medium text-teal">Extrato</Link>
        <Link href="/colaborador/resgates" class="text-slate-600 hover:text-teal">Resgates</Link>
        <Link href="/colaborador/catalogo" class="text-slate-600 hover:text-teal">Catálogo</Link>
      </div>
    </div>
  </nav>

  <main class="mx-auto max-w-3xl px-4 py-8">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-xl font-bold text-slate-900">Extrato FITC</h1>
      <span class="text-sm font-semibold text-teal">Saldo: {balanceFitc} FITC</span>
    </div>

    {#if entries.length === 0}
      <p class="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-500">
        Nenhuma movimentação registrada.
      </p>
    {:else}
      <ul class="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {#each entries as entry (entry.id)}
          <li class="flex items-center justify-between px-4 py-3">
            <div>
              <p class="text-sm font-medium text-slate-900">{entry.description || entry.entry_type}</p>
              <p class="text-xs text-slate-500">{formatDate(entry.created_at)}</p>
            </div>
            <span class={`text-sm font-bold ${entry.amount_fitc < 0 ? "text-red-600" : "text-green-600"}`}>
              {entry.amount_fitc > 0 ? "+" : ""}{entry.amount_fitc} FITC
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </main>
</div>
