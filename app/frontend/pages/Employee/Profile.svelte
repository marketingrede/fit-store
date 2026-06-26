<script>
  import { Link } from "@inertiajs/svelte"

  let { employee = {}, balanceFitc = 0 } = $props()

  const initials = $derived((employee.full_name || "C").charAt(0).toUpperCase())
</script>

<svelte:head>
  <title>Perfil | Colaborador Movimenta+</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
  <nav class="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3">
    <div class="mx-auto flex max-w-3xl items-center justify-between">
      <span class="text-sm font-semibold text-slate-900">Colaborador</span>
      <div class="flex items-center gap-4 text-sm">
        <Link href="/colaborador/perfil" class="font-medium text-teal">Perfil</Link>
        <Link href="/colaborador/extrato" class="text-slate-600 hover:text-teal">Extrato</Link>
        <Link href="/colaborador/resgates" class="text-slate-600 hover:text-teal">Resgates</Link>
        <Link href="/colaborador/catalogo" class="text-slate-600 hover:text-teal">Catálogo</Link>
      </div>
    </div>
  </nav>

  <main class="mx-auto max-w-3xl px-4 py-8">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-teal text-lg font-bold text-white">
          {initials}
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-900">{employee.full_name || "Colaborador"}</h1>
          <p class="text-sm text-slate-500">{employee.email || "—"}</p>
          <p class="text-sm text-slate-500">Matrícula: {employee.employee_id || "—"}</p>
        </div>
      </div>

      <div class="mt-6 rounded-xl bg-teal px-4 py-3 text-white">
        <p class="text-sm opacity-90">Saldo disponível</p>
        <p class="text-2xl font-bold">{balanceFitc} FITC</p>
      </div>

      {#if employee.department}
        <p class="mt-4 text-sm text-slate-600">
          Departamento: <strong>{employee.department}</strong>
        </p>
      {/if}
    </div>
  </main>
</div>
