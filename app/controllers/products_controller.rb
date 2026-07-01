# frozen_string_literal: true

class ProductsController < ApplicationController
  include CatalogFilterable

  layout "application"

  def show
    @product = Product.active.includes(product_attributes: :product_attribute_options).find(params[:id])
    category = CatalogCategory.active.find_by(slug: @product.category)

    render inertia: "Catalog/Show", props: {
      product: serialize_product(@product),
      related: related_products.map { |p| serialize_product(p) },
      category_label: category&.label || @product.category,
      categories: CatalogCategory.active.ordered.map { |c| c.slice(:slug, :label) }
    }
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
