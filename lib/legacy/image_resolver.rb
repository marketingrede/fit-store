# frozen_string_literal: true

module Legacy
  class ImageResolver
    def initialize(root: Rails.root)
      @root = root
      @local_product_images = Dir[@root.join("public/uploads/products/*.webp").to_s].sort
    end

    def resolve(url, product_id: nil)
      normalized = normalize_path(url)
      return normalized if normalized && file_exists?(normalized)

      mapped = product_image_map[product_id]
      return mapped if mapped && file_exists?(mapped)

      assign_local_fallback(product_id)
    end

    private

    def normalize_path(url)
      return nil if url.blank?

      path = url.to_s.strip
      return path if path.start_with?("/uploads/")

      nil
    end

    def file_exists?(public_path)
      File.exist?(@root.join("public", public_path.delete_prefix("/")))
    end

    def product_image_map
      @product_image_map ||= begin
        path = @root.join("db/seeds/legacy_product_images.yml")
        if path.exist?
          YAML.safe_load(path.read, permitted_classes: [], aliases: false).to_h.transform_keys(&:to_i)
        else
          {}
        end
      end
    end

    def assign_local_fallback(product_id)
      return nil if product_id.blank? || @local_product_images.empty?

      index = (product_id.to_i - 1) % @local_product_images.size
      "/uploads/products/#{File.basename(@local_product_images[index])}"
    end
  end
end
