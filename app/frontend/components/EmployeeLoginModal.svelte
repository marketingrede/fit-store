<script>
  import { tick } from "svelte"
  import EmployeeLoginForm from "./EmployeeLoginForm.svelte"

  let {
    open = false,
    error = "",
    returnTo = "/",
    onClose = () => {},
    onSuccess = () => {},
  } = $props()

  let panelElement = $state(null)

  $effect(() => {
    if (!open || typeof document === "undefined") return

    void tick().then(() => panelElement?.focus())

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  })

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onClose()
  }

  function handleWindowKeydown(event) {
    if (!open || event.key !== "Escape") return

    event.preventDefault()
    onClose()
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if open}
  <div
    class="employee-login-modal"
    role="presentation"
    aria-hidden={!open}
    onclick={handleBackdropClick}
  >
    <div class="employee-login-modal__backdrop" aria-hidden="true"></div>

    <div
      class="employee-login-modal__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-login-title"
      tabindex="-1"
      bind:this={panelElement}
    >
      <button type="button" class="employee-login-modal__close" aria-label="Fechar login" onclick={onClose}>
        <span aria-hidden="true">&times;</span>
      </button>

      <p class="employee-login-modal__eyebrow">Movimenta+</p>
      <h2 id="employee-login-title" class="employee-login-modal__title">Entrar na loja</h2>
      <p class="employee-login-modal__desc">
        Use sua matrícula e senha para resgatar produtos com seu saldo FITC.
      </p>

      <EmployeeLoginForm
        {error}
        {returnTo}
        formId="employee-login-modal"
        {onSuccess}
      />

      <p class="employee-login-modal__footer">
        Primeiro acesso?
        <a href="/colaborador/cadastro">Cadastre-se</a>
      </p>
    </div>
  </div>
{/if}
