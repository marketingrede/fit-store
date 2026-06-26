# frozen_string_literal: true

module Admin
  class CatalogCategoriesController < BaseController
    before_action :set_category, only: %i[edit update destroy]

    def index
      @categories = CatalogCategory.ordered
    end

    def new
      @category = CatalogCategory.new(active: true)
    end

    def create
      @category = CatalogCategory.new(category_params)

      if @category.save
        redirect_to admin_catalog_categories_path, notice: "Categoria criada."
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit; end

    def update
      if @category.update(category_params)
        redirect_to admin_catalog_categories_path, notice: "Categoria atualizada."
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @category.destroy!
      redirect_to admin_catalog_categories_path, notice: "Categoria excluída."
    end

    private

    def set_category
      @category = CatalogCategory.find(params[:id])
    end

    def category_params
      params.require(:catalog_category).permit(:slug, :label, :sort_order, :active)
    end
  end
end
