# frozen_string_literal: true

module Admin
  class CatalogTagsController < BaseController
    before_action :set_tag, only: %i[edit update destroy]

    def index
      @tags = CatalogTag.order(:sort_order, :name)
    end

    def new
      @tag = CatalogTag.new(active: true)
    end

    def create
      @tag = CatalogTag.new(tag_params)

      if @tag.save
        redirect_to admin_catalog_tags_path, notice: "Tag criada."
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit; end

    def update
      if @tag.update(tag_params)
        redirect_to admin_catalog_tags_path, notice: "Tag atualizada."
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @tag.destroy!
      redirect_to admin_catalog_tags_path, notice: "Tag excluída."
    end

    private

    def set_tag
      @tag = CatalogTag.find(params[:id])
    end

    def tag_params
      params.require(:catalog_tag).permit(:name, :color, :sort_order, :active)
    end
  end
end
