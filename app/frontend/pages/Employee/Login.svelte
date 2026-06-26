<script>
  import { useForm } from "@inertiajs/svelte"

  let { flash = {} } = $props()

  const form = useForm({
    employee_id: "",
    password: "",
  })

  function submit(event) {
    event.preventDefault()
    $form.post("/colaborador/login")
  }
</script>

<svelte:head>
  <title>Entrar | Colaborador Movimenta+</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
  <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <p class="text-xs font-semibold uppercase tracking-wide text-teal">Movimenta+</p>
    <h1 class="mt-1 text-2xl font-bold text-slate-900">Área do colaborador</h1>
    <p class="mt-2 text-sm text-slate-600">Entre com sua matrícula e senha.</p>

    {#if flash.alert}
      <p class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{flash.alert}</p>
    {/if}

    <form class="mt-6 space-y-4" onsubmit={submit}>
      <div>
        <label for="employee_id" class="mb-1 block text-sm font-medium text-slate-700">Matrícula</label>
        <input
          id="employee_id"
          type="text"
          bind:value={$form.employee_id}
          autocomplete="username"
          class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
      </div>
      <div>
        <label for="password" class="mb-1 block text-sm font-medium text-slate-700">Senha</label>
        <input
          id="password"
          type="password"
          bind:value={$form.password}
          autocomplete="current-password"
          class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
      </div>
      <button
        type="submit"
        class="w-full rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
        disabled={$form.processing}
      >
        {$form.processing ? "Entrando..." : "Entrar"}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-600">
      Primeiro acesso?
      <a href="/colaborador/cadastro" class="font-medium text-teal hover:underline">Cadastre-se</a>
    </p>
  </div>
</div>
