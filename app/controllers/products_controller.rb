# frozen_string_literal: true

class ProductsController < ApplicationController
  include CatalogFilterable

  layout "store"

  def show
    @product = Product.active.includes(product_attributes: :product_attribute_options).find(params[:id])
    @page_props = {
      product: serialize_product(@product),
      related: related_products.map { |p| serialize_product(p) }
    }

    respond_to do |format|
      format.html
      format.json { render json: @page_props.merge(inertia_share) }
    end
  end

  private

  def related_products
    Product.active
           .where(category: @product.category)
           .where.not(id: @product.id)
           .includes(product_attributes: :product_attribute_options)
           .limit(4)
  end
end
