# frozen_string_literal: true

module Api
  class CatalogProductsController < ApplicationController
    include CatalogFilterable

    def index
      filters = catalog_filter_params
      result = paginate_products(filtered_products_scope(filters), page: filters[:page])

      render json: {
        ok: true,
        products: result[:items].map { |p| serialize_product(p) },
        page: result[:page],
        has_more: result[:has_more],
        total: result[:total]
      }
    end
  end
end
