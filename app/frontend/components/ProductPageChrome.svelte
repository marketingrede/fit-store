<script>
  import { Link } from "@inertiajs/svelte"

  let {
    currentEmployee = null,
    balanceFitc = null,
    onLogin = () => {},
  } = $props()
</script>

<header class="topbar">
  <div class="topbar-row topbar-row--primary product-page-chrome">
    <div class="product-page-chrome__start">
      <Link href="/" class="product-page-chrome__back" aria-label="Voltar ao catálogo">
        ← Catálogo
      </Link>
    </div>

    <div class="topbar-brand topbar-brand--mobile product-page-chrome__brand">
      <Link href="/" class="topbar-app-mark" aria-label="Movimenta+ Fit Store">
        <img src="/logo.svg" alt="" class="topbar-app-mark__logo" width="32" height="32" decoding="async" />
        <span class="topbar-app-mark__text">
          <span class="topbar-app-mark__eyebrow">Movimenta+</span>
          <span class="topbar-app-mark__name">Fit Store</span>
        </span>
      </Link>
    </div>

    <div class="topbar-mobile-actions">
      {#if currentEmployee}
        <a href="/colaborador" class="topbar-mobile-chip topbar-mobile-chip--balance" aria-label="Seu saldo FITC">
          <span class="topbar-mobile-chip__dot" aria-hidden="true"></span>
          {balanceFitc} FITC
        </a>
      {:else}
        <button type="button" class="topbar-mobile-chip topbar-mobile-chip--muted" onclick={onLogin}>
          Entrar
        </button>
      {/if}
    </div>
  </div>
</header>
