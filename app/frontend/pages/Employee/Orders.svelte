<script>
  import EmployeeAreaLayout from "../../components/EmployeeAreaLayout.svelte"

  let { orders = [] } = $props()

  function formatDate(value) {
    if (!value) return "—"
    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function statusLabel(status) {
    const labels = {
      confirmed: "Confirmado",
      reversed: "Estornado",
      pending: "Pendente",
    }
    return labels[status] || status
  }
</script>

<svelte:head>
  <title>Resgates | Colaborador Movimenta+</title>
</svelte:head>

<EmployeeAreaLayout active="orders">
  <div class="employee-card">
    <h1 class="employee-card__title">Meus resgates</h1>

    {#if orders.length === 0}
      <p class="employee-empty">Você ainda não realizou resgates.</p>
    {:else}
      <ul class="employee-list employee-list--cards">
        {#each orders as order (order.id)}
          <li class="employee-order">
            <div>
              <p class="employee-order__title">{order.product_name}</p>
              <p class="employee-order__meta">{formatDate(order.created_at)}</p>
            </div>
            <div class="employee-order__side">
              <p class="employee-order__price">{order.product_price_fitc} FITC</p>
              <p class="employee-order__status">{statusLabel(order.status)}</p>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</EmployeeAreaLayout>
