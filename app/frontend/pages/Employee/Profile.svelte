<script>
  import EmployeeAreaLayout from "../../components/EmployeeAreaLayout.svelte"

  let { employee = {}, balanceFitc = 0, recent_orders: recentOrders = [] } = $props()

  const initials = $derived((employee.full_name || "C").charAt(0).toUpperCase())

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
  <title>Perfil | Colaborador Movimenta+</title>
</svelte:head>

<EmployeeAreaLayout active="profile" {balanceFitc}>
  <div class="employee-card">
    <div class="employee-card__profile">
      <div class="employee-card__avatar">{initials}</div>
      <div>
        <h1 class="employee-card__title">{employee.full_name || "Colaborador"}</h1>
        <p class="employee-card__meta">{employee.email || "—"}</p>
        <p class="employee-card__meta">Matrícula: {employee.employee_id || "—"}</p>
      </div>
    </div>

    <div class="employee-card__balance">
      <p class="employee-card__balance-label">Saldo disponível</p>
      <p class="employee-card__balance-value">{balanceFitc} FITC</p>
    </div>

    {#if recentOrders.length}
      <div class="employee-card__section">
        <h2 class="employee-card__section-title">Resgates recentes</h2>
        <ul class="employee-list">
          {#each recentOrders as order (order.id)}
            <li class="employee-list__item">
              <span>{order.product_name}</span>
              <span>{order.product_price_fitc} FITC · {formatDate(order.created_at)}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</EmployeeAreaLayout>
