<script>
  import { useForm, page } from "@inertiajs/svelte"

  const form = useForm({
    employee_id: "",
    email: "",
    password: "",
    password_confirmation: "",
  })

  function submit(event) {
    event.preventDefault()
    $form.transform((data) => ({
      employee_id: data.employee_id,
      email: data.email,
      password: data.password,
      password_confirm: data.password_confirmation,
    }))
    $form.post("/colaborador/registro", {
      preserveScroll: true,
    })
  }
</script>

<svelte:head>
  <title>Cadastro | Colaborador Movimenta+</title>
</svelte:head>

<div class="auth-page">
  <div class="auth-page__card">
    <p class="employee-login-modal__eyebrow">Movimenta+</p>
    <h1 class="auth-page__title">Cadastro de colaborador</h1>
    <p class="auth-page__desc">Use a matrícula informada pela empresa.</p>

    {#if $page.props.flash?.alert}
      <p class="employee-login-form__error" role="alert">{$page.props.flash.alert}</p>
    {/if}

    <form class="employee-login-form" onsubmit={submit}>
      <div class="employee-login-form__field">
        <label class="employee-login-form__label" for="register-employee_id">Matrícula</label>
        <input id="register-employee_id" type="text" bind:value={$form.employee_id} class="employee-login-form__input" required />
      </div>
      <div class="employee-login-form__field">
        <label class="employee-login-form__label" for="register-email">E-mail</label>
        <input id="register-email" type="email" bind:value={$form.email} class="employee-login-form__input" required />
      </div>
      <div class="employee-login-form__field">
        <label class="employee-login-form__label" for="register-password">Senha</label>
        <input id="register-password" type="password" bind:value={$form.password} class="employee-login-form__input" required />
      </div>
      <div class="employee-login-form__field">
        <label class="employee-login-form__label" for="register-password_confirmation">Confirmar senha</label>
        <input id="register-password_confirmation" type="password" bind:value={$form.password_confirmation} class="employee-login-form__input" required />
      </div>
      <button type="submit" class="redeem-button employee-login-form__submit" disabled={$form.processing}>
        {$form.processing ? "Cadastrando..." : "Cadastrar"}
      </button>
    </form>

    <p class="employee-login-modal__footer">
      Já tem conta?
      <a href="/colaborador/login">Entrar</a>
    </p>
  </div>
</div>
