# frozen_string_literal: true

module Colaborador
  class CatalogController < BaseController
    include CatalogFilterable

    def index
      balance = current_employee.fitc_wallet.balance_fitc
      filters = catalog_filter_params
      scope = filtered_products_scope(filters)
      affordable = scope.select { |p| p.price_fitc <= balance }

      render inertia: "Employee/Catalog", props: {
        balanceFitc: balance,
        employee: current_employee.slice(:id, :employee_id, :full_name, :email),
        products: affordable.map { |p| serialize_product(p) },
        categories: CatalogCategory.active.ordered.map { |c| c.slice(:slug, :label) },
        filters: { q: filters[:q] },
        total_products: scope.count,
        affordable_count: affordable.size
      }
    end

    def api
      balance = current_employee.fitc_wallet.balance_fitc
      scope = Product.active.order(:price_fitc)
      scope = scope.where(category: params[:categoria]) if params[:categoria].present?
      if params[:q].present?
        scope = scope.where("name LIKE ?", "%#{Product.sanitize_sql_like(params[:q])}%")
      end

      products = scope.select { |p| p.price_fitc <= balance }.map do |p|
        p.slice(:id, :name, :category, :price_fitc, :image_url)
      end

      render json: { products: products, balance: balance, count: products.size }
    end
  end
end
