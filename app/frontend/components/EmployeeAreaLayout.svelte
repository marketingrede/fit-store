<script>
  import { Link, router } from "@inertiajs/svelte"

  let {
    active = "profile",
    balanceFitc = null,
    children,
  } = $props()

  const navItems = [
    { id: "profile", href: "/colaborador", label: "Perfil" },
    { id: "statement", href: "/colaborador/extrato", label: "Extrato" },
    { id: "orders", href: "/colaborador/resgates", label: "Resgates" },
    { id: "catalog", href: "/colaborador/catalogo", label: "Catálogo" },
  ]

  function navClass(id) {
    return `employee-nav__link ${active === id ? "is-active" : ""}`
  }

  function logout() {
    router.post("/colaborador/logout")
  }
</script>

<div class="employee-area">
  <header class="employee-area__header">
    <div class="employee-area__header-inner">
      <div class="employee-area__brand">
        <Link href="/" class="employee-area__store-link">← Loja</Link>
        <span class="employee-area__title">Área do colaborador</span>
      </div>

      <div class="employee-area__meta">
        {#if balanceFitc != null}
          <span class="employee-area__balance">{balanceFitc} FITC</span>
        {/if}
        <button type="button" class="employee-area__logout" onclick={logout}>Sair</button>
      </div>
    </div>

    <nav class="employee-nav" aria-label="Menu do colaborador">
      {#each navItems as item (item.id)}
        <Link href={item.href} class={navClass(item.id)}>{item.label}</Link>
      {/each}
    </nav>
  </header>

  <main class="employee-area__main">
    {@render children()}
  </main>
</div>
