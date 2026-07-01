# frozen_string_literal: true

class CatalogController < ApplicationController
  include CatalogFilterable

  layout "application"

  def index
    filters = catalog_filter_params
    result = paginate_products(filtered_products_scope(filters), page: filters[:page])
    @categories = CatalogCategory.active.ordered
    @tags = CatalogTag.active.ordered
    @cta_cards = CatalogCtaCard.where(active: true).order(:slot)
    @announcements = Announcement.published.limit(5)
    props = catalog_page_props(result, filters)

    respond_to do |format|
      format.html { render inertia: "Catalog/Index", props: props }
      format.json { render json: props.merge(inertia_share) }
    end
  end

  private

  def catalog_page_props(result, filters)
    per_page = result[:per_page]
    total = result[:total]
    page = result[:page]
    pages = per_page.positive? ? (total.to_f / per_page).ceil : 1

    {
      products: result[:items].map { |p| serialize_product(p) },
      filters: {
        q: filters[:q],
        categorias: filters[:categorias],
        tags: filters[:tags],
        price_min: filters[:price_min],
        price_max: filters[:price_max]
      },
      pagination: {
        page: page,
        per_page: per_page,
        total: total,
        pages: pages,
        prev: page > 1,
        next: result[:has_more]
      },
      categories: @categories.map { |c| c.slice(:slug, :label) },
      tags: @tags.map { |t| t.slice(:name, :color) },
      cta_cards: @cta_cards.map { |card| serialize_cta_card(card) },
      price_bounds: catalog_price_bounds,
      announcements: @announcements.map { |a| a.slice(:id, :title, :slug, :published_at) }
    }
  end

  def serialize_cta_card(card)
    card.slice(:id, :slot, :variant, :title, :body, :image_url, :link_label, :link_url)
  end

  CATALOG_PRICE_MAX = 1000

  def catalog_price_bounds
    scope = Product.active

    {
      min: scope.minimum(:price_fitc).to_i,
      max: CATALOG_PRICE_MAX
    }
  end
end
