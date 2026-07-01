<script>
  import EmployeeAreaLayout from "../../components/EmployeeAreaLayout.svelte"

  let { entries = [], balanceFitc = 0 } = $props()

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
  <title>Extrato | Colaborador Movimenta+</title>
</svelte:head>

<EmployeeAreaLayout active="statement" {balanceFitc}>
  <div class="employee-card">
    <div class="employee-card__header-row">
      <h1 class="employee-card__title">Extrato FITC</h1>
      <span class="employee-card__pill">{balanceFitc} FITC</span>
    </div>

    {#if entries.length === 0}
      <p class="employee-empty">Nenhuma movimentação registrada.</p>
    {:else}
      <ul class="employee-list employee-list--stacked">
        {#each entries as entry (entry.id)}
          <li class="employee-list__item employee-list__item--between">
            <div>
              <p class="employee-list__title">{entry.description || entry.entry_type}</p>
              <p class="employee-list__meta">{formatDate(entry.created_at)}</p>
            </div>
            <span class={`employee-list__amount ${entry.amount_fitc < 0 ? "is-debit" : "is-credit"}`}>
              {entry.amount_fitc > 0 ? "+" : ""}{entry.amount_fitc} FITC
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</EmployeeAreaLayout>
