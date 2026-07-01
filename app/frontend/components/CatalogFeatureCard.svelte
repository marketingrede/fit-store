<script>
  let { card = null } = $props()

  let classes = $derived.by(() => {
    if (!card) return "catalog-feature-card catalog-feature-card--desktop"

    const variant = ["teal", "blue", "surface"].includes(card.variant) ? card.variant : "teal"
    const imageClass = card.image_url ? " catalog-feature-card--has-image" : ""

    return `catalog-feature-card catalog-feature-card--desktop catalog-feature-card--${variant}${imageClass}`
  })

  let hasContent = $derived(Boolean(card?.title || card?.body || card?.link_label))
  let ariaLabel = $derived(card?.title || "Destaque do catálogo")
</script>

{#if card}
  {#if card.link_url}
    <a href={card.link_url} class={classes} aria-label={ariaLabel}>
      {#if card.image_url}
        <img
          src={card.image_url}
          alt={card.title || "Destaque do catálogo"}
          class="catalog-feature-card__image"
          loading="lazy"
        />
      {/if}

      {#if hasContent}
        <div class="catalog-feature-card__content">
          {#if card.title}
            <h2 class="catalog-feature-card__title">{card.title}</h2>
          {/if}
          {#if card.body}
            <p class="catalog-feature-card__text">{card.body}</p>
          {/if}
          {#if card.link_label}
            <span class="catalog-feature-card__cta">{card.link_label}</span>
          {/if}
        </div>
      {/if}
    </a>
  {:else}
    <article class={classes} aria-label={ariaLabel}>
      {#if card.image_url}
        <img
          src={card.image_url}
          alt={card.title || "Destaque do catálogo"}
          class="catalog-feature-card__image"
          loading="lazy"
        />
      {/if}

      {#if hasContent}
        <div class="catalog-feature-card__content">
          {#if card.title}
            <h2 class="catalog-feature-card__title">{card.title}</h2>
          {/if}
          {#if card.body}
            <p class="catalog-feature-card__text">{card.body}</p>
          {/if}
          {#if card.link_label}
            <span class="catalog-feature-card__cta">{card.link_label}</span>
          {/if}
        </div>
      {/if}
    </article>
  {/if}
{/if}
