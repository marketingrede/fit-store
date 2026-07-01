# frozen_string_literal: true

module CatalogFilterable
  extend ActiveSupport::Concern

  PER_PAGE = 24

  private

  def catalog_filter_params
    category_slugs = Array(params[:categorias]).compact_blank
    category_slugs = Array(params[:category]).compact_blank if category_slugs.empty?

    {
      q: params[:q].to_s.strip.presence,
      categorias: valid_category_slugs(category_slugs),
      tags: valid_tag_names(Array(params[:tags]).compact_blank),
      price_min: parse_price_param(params[:price_min]),
      price_max: parse_price_param(params[:price_max]),
      page: [ params[:page].to_i, 1 ].max
    }
  end

  def filtered_products_scope(filters = catalog_filter_params)
    scope = Product.active.order(:name)
    scope = scope.where("name LIKE ?", "%#{Product.sanitize_sql_like(filters[:q])}%") if filters[:q]
    scope = scope.where(category: filters[:categorias]) if filters[:categorias].present?
    scope = scope.where(tag: filters[:tags]) if filters[:tags].present?
    scope = scope.where(price_fitc: filters[:price_min]..) if filters[:price_min]
    scope = scope.where(price_fitc: ..filters[:price_max]) if filters[:price_max]
    scope
  end

  def paginate_products(scope, page: 1, per_page: PER_PAGE)
    total = scope.count
    offset = (page - 1) * per_page
    items = scope.includes(product_attributes: :product_attribute_options)
                 .limit(per_page)
                 .offset(offset)

    {
      items: items,
      page: page,
      per_page: per_page,
      total: total,
      has_more: offset + items.size < total
    }
  end

  def serialize_product(product)
    {
      id: product.id,
      name: product.name,
      category: product.category,
      price_fitc: product.price_fitc,
      description: product.description,
      image_url: product.image_url,
      tag: product.tag,
      variations: product.product_attributes.order(:sort_order).map do |attr|
        {
          id: attr.id,
          name: attr.name,
          unit: attr.unit,
          required: attr.required,
          options: attr.product_attribute_options.order(:sort_order).map do |opt|
            {
              id: opt.id,
              label: opt.label,
              image_url: opt.image_url,
              price_fitc_override: opt.price_fitc_override
            }
          end
        }
      end
    }
  end

  def valid_category_slugs(slugs)
    active = CatalogCategory.active.pluck(:slug)
    slugs.select { |slug| active.include?(slug) }
  end

  def valid_tag_names(names)
    active = CatalogTag.active.pluck(:name)
    names.select { |name| active.include?(name) }
  end

  def parse_price_param(value)
    return nil if value.blank?

    Integer(value)
  rescue ArgumentError
    nil
  end
end
