<script>
  import { page } from "@inertiajs/svelte"
  import EmployeeLoginForm from "../../components/EmployeeLoginForm.svelte"

  let { return_to: returnTo = "/colaborador" } = $props()

  let loginError = $derived($page.props.flash?.alert || "")
</script>

<svelte:head>
  <title>Entrar | Colaborador Movimenta+</title>
</svelte:head>

<div class="auth-page">
  <div class="auth-page__card">
    <p class="employee-login-modal__eyebrow">Movimenta+</p>
    <h1 class="auth-page__title">Área do colaborador</h1>
    <p class="auth-page__desc">Entre com sua matrícula e senha.</p>

    <EmployeeLoginForm formId="employee-login-page" {returnTo} error={loginError} />

    <p class="employee-login-modal__footer">
      Primeiro acesso?
      <a href="/colaborador/cadastro">Cadastre-se</a>
    </p>
  </div>
</div>
