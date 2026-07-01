# frozen_string_literal: true

module Admin
  class ProductsController < BaseController
    before_action :set_product, only: %i[edit update destroy form_data]

    def index
      @categories = CatalogCategory.active.ordered
      @tags = CatalogTag.active.ordered
      @filters = product_filters
      @product_totals = {
        total: Product.count,
        active: Product.active.count,
        inactive: Product.where(active: false).count
      }

      scope = filtered_products
      @products_count = scope.count
      @pagy, @products = pagy(:offset, scope.order(:name), limit: allowed_per_page(@filters[:per_page]))
    end

    def new
      @product = Product.new(active: true)
      load_form_collections
    end

    def create
      @product = Product.new
      load_form_collections
      result = save_product(@product)

      if result.ok
        redirect_to admin_products_path, notice: "Produto criado."
      else
        flash.now[:alert] = result.error
        render :new, status: :unprocessable_entity
      end
    end

    def edit
      load_form_collections
    end

    def update
      load_form_collections
      result = save_product(@product)

      if result.ok
        redirect_to admin_products_path, notice: "Produto atualizado."
      else
        flash.now[:alert] = result.error
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @product.destroy!
      redirect_to admin_products_path, notice: "Produto excluído."
    end

    def form_data
      render json: product_form_payload(@product)
    end

    def bulk
      ids = Array(params[:product_ids]).map(&:to_i).uniq
      action = params[:bulk_action].to_s
      scope = Product.where(id: ids)

      case action
      when "activate"
        scope.update_all(active: true)
        redirect_to admin_products_path(product_filters), notice: "#{scope.count} produto(s) ativado(s)."
      when "deactivate"
        scope.update_all(active: false)
        redirect_to admin_products_path(product_filters), notice: "#{scope.count} produto(s) desativado(s)."
      when "delete"
        count = scope.count
        scope.destroy_all
        redirect_to admin_products_path(product_filters), notice: "#{count} produto(s) excluído(s)."
      else
        redirect_to admin_products_path(product_filters), alert: "Ação em lote inválida."
      end
    end

    private

    def set_product
      @product = Product.includes(product_attributes: :product_attribute_options).find(params[:id])
    end

    def load_form_collections
      @categories = CatalogCategory.active.ordered
      @tags = CatalogTag.active.ordered
    end

    def save_product(product)
      Admin::Products::SaveWithVariations.call(
        product: product,
        product_params: product_params,
        variations_json: params[:variations_json]
      )
    end

    def filtered_products
      scope = Product.all
      scope = scope.where(category: @filters[:category]) if @filters[:category].present?
      scope = scope.where(active: @filters[:status] == "active") if @filters[:status].in?(%w[active inactive])
      if @filters[:query].present?
        query = "%#{Product.sanitize_sql_like(@filters[:query].downcase)}%"
        scope = scope.where("LOWER(name) LIKE :query OR LOWER(description) LIKE :query", query:)
      end
      scope
    end

    def product_params
      params.require(:product).permit(
        :name, :category, :price_fitc, :description, :image_url, :tag, :active
      )
    end

    def product_filters
      params.permit(:query, :category, :status, :per_page, :page).to_h.symbolize_keys
    end

    def allowed_per_page(value)
      value = value.to_i
      [ 15, 30, 50 ].include?(value) ? value : 15
    end

    def product_form_payload(product)
      {
        id: product.id,
        name: product.name,
        category: product.category,
        price_fitc: product.price_fitc,
        description: product.description,
        image_url: product.image_url,
        tag: product.tag,
        active: product.active,
        variations: product.product_attributes.map do |attribute|
          {
            id: attribute.id,
            name: attribute.name,
            unit: attribute.unit,
            required: attribute.required,
            allow_option_image: attribute.allow_option_image,
            options: attribute.product_attribute_options.map do |option|
              {
                id: option.id,
                label: option.label,
                price_fitc_override: option.price_fitc_override,
                image_url: option.image_url
              }
            end
          }
        end
      }
    end
  end
end
