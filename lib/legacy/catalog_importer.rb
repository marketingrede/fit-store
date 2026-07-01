# frozen_string_literal: true

require "sqlite3"

module Legacy
  class CatalogImporter
    def self.call(source: nil, replace_products: false)
      new(source: source, replace_products: replace_products).call
    end

    def initialize(source: nil, replace_products: false)
      @source = source
      @replace_products = replace_products
      @image_resolver = ImageResolver.new
      @attribute_id_map = {}
      @option_id_map = {}
    end

    def call
      path = resolve_source_path
      puts "Importando catálogo legado de #{path}..."

      legacy = SQLite3::Database.new(path)
      legacy.results_as_hash = true

      ActiveRecord::Base.transaction do
        Product.delete_all if @replace_products
        import_catalog_categories(legacy)
        import_catalog_tags(legacy)
        import_variation_presets(legacy)
        import_products(legacy)
        supplement_missing_products
        import_product_attributes(legacy)
        import_product_attribute_options(legacy)
        import_catalog_cta_cards(legacy)
        import_announcements(legacy)
      end

      summary
    end

    private

    def resolve_source_path
      return @source if @source.present? && File.exist?(@source)

      candidates = [
        ENV["LEGACY_DB_PATH"],
        Rails.root.join("lib/legacy/data/legacy_app.db").to_s,
        Rails.root.join("storage/legacy_app.db").to_s,
        Rails.root.join("data/app.db").to_s
      ].compact

      found = candidates.find { |path| File.exist?(path) && File.size(path).positive? }
      return found if found

      Legacy::SqliteBuilder.build!
    end

    def import_catalog_categories(legacy)
      return unless table_exists?(legacy, "catalog_categories")

      legacy.execute("SELECT * FROM catalog_categories ORDER BY sort_order, id").each do |row|
        category = CatalogCategory.find_or_initialize_by(slug: row["slug"])
        category.assign_attributes(
          label: row["label"],
          sort_order: row["sort_order"],
          active: truthy?(row["active"])
        )
        category.save!
      end
    end

    def import_catalog_tags(legacy)
      return unless table_exists?(legacy, "catalog_tags")

      legacy.execute("SELECT * FROM catalog_tags ORDER BY sort_order, id").each do |row|
        tag = CatalogTag.find_or_initialize_by(name: row["name"])
        tag.assign_attributes(
          color: row["color"],
          sort_order: row["sort_order"],
          active: truthy?(row["active"])
        )
        tag.save!
      end
    end

    def import_variation_presets(legacy)
      return unless table_exists?(legacy, "variation_presets")

      legacy.execute("SELECT * FROM variation_presets ORDER BY sort_order, id").each do |row|
        preset = VariationPreset.find_or_initialize_by(name: row["name"])
        preset.assign_attributes(
          unit: row["unit"].to_s,
          required: truthy?(row["required"]),
          allow_option_image: truthy?(row["allow_option_image"]),
          options_json: row["options_json"].presence || "[]",
          sort_order: row["sort_order"],
          active: truthy?(row["active"])
        )
        preset.save!
      end
    end

    def import_products(legacy)
      legacy.execute("SELECT * FROM products ORDER BY id").each do |row|
        product = Product.find_or_initialize_by(id: row["id"])
        product.assign_attributes(
          name: row["name"],
          category: row["category"],
          price_fitc: row["price_fitc"],
          description: row["description"],
          image_url: @image_resolver.resolve(row["image_url"], product_id: row["id"]),
          tag: row["tag"],
          active: truthy?(row["active"])
        )
        product.save!
      end
    end

    def supplement_missing_products
      return unless defined?(LEGACY_PRODUCTS)

      LEGACY_PRODUCTS.each do |row|
        next if Product.exists?(id: row[:id])

        Product.create!(
          id: row[:id],
          name: row[:name],
          category: row[:category],
          price_fitc: row[:price_fitc],
          description: row[:description],
          image_url: @image_resolver.resolve(row[:image_url], product_id: row[:id]),
          tag: row[:tag],
          active: true
        )
      end
    end

    def import_product_attributes(legacy)
      return unless table_exists?(legacy, "product_attributes")

      legacy.execute("SELECT * FROM product_attributes ORDER BY sort_order, id").each do |row|
        product = Product.find_by(id: row["product_id"])
        next unless product

        attribute = product.product_attributes.find_or_initialize_by(name: row["name"])
        attribute.assign_attributes(
          unit: row["unit"],
          required: truthy?(row["required"]),
          allow_option_image: truthy?(row["allow_option_image"]),
          sort_order: row["sort_order"]
        )
        attribute.save!
        @attribute_id_map[row["id"]] = attribute.id
      end
    end

    def import_product_attribute_options(legacy)
      return unless table_exists?(legacy, "product_attribute_options")

      legacy.execute("SELECT * FROM product_attribute_options ORDER BY sort_order, id").each do |row|
        legacy_attribute_id = row["attribute_id"] || row["product_attribute_id"]
        attribute_id = @attribute_id_map[legacy_attribute_id]
        next unless attribute_id

        attribute = ProductAttribute.find_by(id: attribute_id)
        next unless attribute

        option = attribute.product_attribute_options.find_or_initialize_by(label: row["label"])
        option.assign_attributes(
          image_url: @image_resolver.resolve(row["image_url"]),
          price_fitc_override: row["price_fitc_override"],
          sort_order: row["sort_order"]
        )
        option.save!
        @option_id_map[row["id"]] = option.id
      end
    end

    def import_catalog_cta_cards(legacy)
      return unless table_exists?(legacy, "catalog_cta_cards")

      legacy.execute("SELECT * FROM catalog_cta_cards ORDER BY slot, id").each do |row|
        card = CatalogCtaCard.find_or_initialize_by(slot: row["slot"])
        card.assign_attributes(
          variant: row["variant"].presence || "teal",
          title: row["title"],
          body: row["body"],
          link_url: row["link_url"],
          link_label: row["link_label"],
          image_url: @image_resolver.resolve(row["image_url"]),
          active: truthy?(row["active"])
        )
        card.save!
      end
    end

    def import_announcements(legacy)
      return unless table_exists?(legacy, "announcements")

      legacy.execute("SELECT * FROM announcements ORDER BY id").each do |row|
        announcement = Announcement.find_or_initialize_by(slug: row["slug"])
        announcement.assign_attributes(
          title: row["title"],
          content_html: row["content_html"],
          image_url: @image_resolver.resolve(row["image_url"]),
          crop_data: row["crop_data"],
          status: row["status"].presence || "draft",
          published_at: row["published_at"]
        )
        announcement.save!
      end
    end

    def table_exists?(legacy, name)
      legacy.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
        [ name ]
      ).any?
    end

    def truthy?(value)
      value.to_s.in?(%w[1 true t yes])
    end

    def summary
      {
        products: Product.count,
        categories: CatalogCategory.count,
        tags: CatalogTag.count,
        attributes: ProductAttribute.count,
        options: ProductAttributeOption.count,
        cta_cards: CatalogCtaCard.count,
        announcements: Announcement.count
      }
    end
  end
end
