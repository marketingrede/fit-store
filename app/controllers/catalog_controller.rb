# frozen_string_literal: true

class CatalogController < ApplicationController
  include CatalogFilterable

  layout "store"

  def index
    filters = catalog_filter_params
    result = paginate_products(filtered_products_scope(filters), page: filters[:page])
    @products = result[:items]
    @filters = filters
    @pagination = result.except(:items)
    @categories = CatalogCategory.active.ordered
    @tags = CatalogTag.active.ordered
    @cta_cards = CatalogCtaCard.where(active: true).order(:slot)
    @announcements = Announcement.published.limit(5)
    @page_props = catalog_page_props(result, filters)

    respond_to do |format|
      format.html
      format.json { render json: @page_props.merge(inertia_share) }
    end
  end

  private

  def catalog_page_props(result, filters)
    {
      products: result[:items].map { |p| serialize_product(p) },
      filters: filters.except(:page),
      pagination: result.except(:items),
      categories: @categories.map { |c| c.slice(:slug, :label) },
      tags: @tags.map { |t| t.slice(:name, :color) },
      cta_cards: @cta_cards,
      announcements: @announcements.map { |a| a.slice(:id, :title, :slug, :published_at) }
    }
  end
end
