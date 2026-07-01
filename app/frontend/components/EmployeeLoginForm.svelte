<script>
  import { useForm } from "@inertiajs/svelte"

  let {
    error = "",
    returnTo = "/",
    formId = "employee-login",
    onSuccess = () => {},
  } = $props()

  const form = useForm({
    employee_id: "",
    password: "",
  })

  function submit(event) {
    event.preventDefault()

    $form.transform((data) => ({ ...data, return_to: returnTo }))
    $form.post("/colaborador/login", {
      preserveScroll: true,
      preserveState: true,
      onSuccess: (page) => {
        if (page.props.flash?.alert) return
        onSuccess()
      },
    })
  }
</script>

{#if error}
  <p class="employee-login-form__error" role="alert">{error}</p>
{/if}

<form class="employee-login-form" onsubmit={submit}>
  <div class="employee-login-form__field">
    <label class="employee-login-form__label" for="{formId}-employee_id">Matrícula</label>
    <input
      id="{formId}-employee_id"
      type="text"
      bind:value={$form.employee_id}
      autocomplete="username"
      class="employee-login-form__input"
      required
    />
  </div>

  <div class="employee-login-form__field">
    <label class="employee-login-form__label" for="{formId}-password">Senha</label>
    <input
      id="{formId}-password"
      type="password"
      bind:value={$form.password}
      autocomplete="current-password"
      class="employee-login-form__input"
      required
    />
  </div>

  <button type="submit" class="redeem-button employee-login-form__submit" disabled={$form.processing}>
    {$form.processing ? "Entrando..." : "Entrar"}
  </button>
</form>
