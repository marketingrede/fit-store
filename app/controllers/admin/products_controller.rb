# frozen_string_literal: true

module Admin
  class ProductsController < BaseController
    before_action :set_product, only: %i[edit update destroy]

    def index
      @products = Product.order(:name)
      @categories = CatalogCategory.active.ordered
    end

    def new
      @product = Product.new(active: true)
      @categories = CatalogCategory.active.ordered
    end

    def create
      @product = Product.new(product_params)
      @categories = CatalogCategory.active.ordered

      if @product.save
        redirect_to admin_products_path, notice: "Produto criado."
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit
      @categories = CatalogCategory.active.ordered
    end

    def update
      @categories = CatalogCategory.active.ordered

      if @product.update(product_params)
        redirect_to admin_products_path, notice: "Produto atualizado."
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @product.destroy!
      redirect_to admin_products_path, notice: "Produto excluído."
    end

    private

    def set_product
      @product = Product.find(params[:id])
    end

    def product_params
      params.require(:product).permit(
        :name, :category, :price_fitc, :description, :image_url, :tag, :active
      )
    end
  end
end
