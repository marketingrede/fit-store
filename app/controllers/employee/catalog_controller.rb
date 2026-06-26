# frozen_string_literal: true

module Employee
  class CatalogController < BaseController
    include CatalogFilterable

    def index
      balance = current_employee.fitc_wallet.balance_fitc
      all_products = Product.active.order(:price_fitc)
      affordable = all_products.select { |p| p.price_fitc <= balance }
      @balance = balance
      @products = affordable
      @total_products = all_products.size
      @affordable_count = affordable.size
      @page_props = {
        balance: balance,
        products: affordable.map { |p| serialize_product(p) },
        total_products: @total_products,
        affordable_count: @affordable_count
      }

      respond_to do |format|
        format.html
        format.json { render json: @page_props.merge(inertia_share) }
      end
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
