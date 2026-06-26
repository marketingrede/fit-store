<script>
  import { useForm } from "@inertiajs/svelte"

  let { flash = {} } = $props()

  const form = useForm({
    employee_id: "",
    email: "",
    password: "",
    password_confirmation: "",
  })

  function submit(event) {
    event.preventDefault()
    $form.post("/colaborador/cadastro")
  }
</script>

<svelte:head>
  <title>Cadastro | Colaborador Movimenta+</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
  <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <p class="text-xs font-semibold uppercase tracking-wide text-teal">Movimenta+</p>
    <h1 class="mt-1 text-2xl font-bold text-slate-900">Cadastro de colaborador</h1>
    <p class="mt-2 text-sm text-slate-600">Use a matrícula informada pela empresa.</p>

    {#if flash.alert}
      <p class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{flash.alert}</p>
    {/if}

    <form class="mt-6 space-y-4" onsubmit={submit}>
      <div>
        <label for="employee_id" class="mb-1 block text-sm font-medium text-slate-700">Matrícula</label>
        <input id="employee_id" type="text" bind:value={$form.employee_id} class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
      </div>
      <div>
        <label for="email" class="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
        <input id="email" type="email" bind:value={$form.email} class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
      </div>
      <div>
        <label for="password" class="mb-1 block text-sm font-medium text-slate-700">Senha</label>
        <input id="password" type="password" bind:value={$form.password} class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
      </div>
      <div>
        <label for="password_confirmation" class="mb-1 block text-sm font-medium text-slate-700">Confirmar senha</label>
        <input id="password_confirmation" type="password" bind:value={$form.password_confirmation} class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
      </div>
      <button type="submit" class="w-full rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark" disabled={$form.processing}>
        {$form.processing ? "Cadastrando..." : "Cadastrar"}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-600">
      Já tem conta?
      <a href="/colaborador/login" class="font-medium text-teal hover:underline">Entrar</a>
    </p>
  </div>
</div>
