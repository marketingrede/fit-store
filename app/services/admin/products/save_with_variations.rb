# frozen_string_literal: true

module Admin
  module Products
    class SaveWithVariations
      Result = Data.define(:ok, :product, :error)

      def self.call(product:, product_params:, variations_json: nil)
        new(product:, product_params:, variations_json:).call
      end

      def initialize(product:, product_params:, variations_json: nil)
        @product = product
        @product_params = product_params
        @variations_json = variations_json
      end

      def call
        ActiveRecord::Base.transaction do
          @product.assign_attributes(@product_params)
          @product.save!
          sync_variations! unless @variations_json.nil?
        end

        Result.new(ok: true, product: @product, error: nil)
      rescue ActiveRecord::RecordInvalid
        Result.new(ok: false, product: @product, error: @product.errors.full_messages.to_sentence)
      rescue JSON::ParserError
        Result.new(ok: false, product: @product, error: "Variações inválidas.")
      end

      private

      def sync_variations!
        payload = JSON.parse(@variations_json)
        return unless payload.is_a?(Array)

        kept_ids = []

        payload.each_with_index do |row, index|
          attribute = find_or_build_attribute(row)
          attribute.assign_attributes(
            name: row["name"].to_s.strip,
            unit: row["unit"].presence,
            required: row.fetch("required", true),
            allow_option_image: row.fetch("allow_option_image", false),
            sort_order: index
          )
          attribute.save!
          kept_ids << attribute.id
          sync_options!(attribute, row.fetch("options", []))
        end

        @product.product_attributes.where.not(id: kept_ids).destroy_all
      end

      def find_or_build_attribute(row)
        if row["id"].present?
          @product.product_attributes.find_by(id: row["id"]) || @product.product_attributes.build
        else
          @product.product_attributes.build
        end
      end

      def sync_options!(attribute, options_payload)
        kept_ids = []

        options_payload.each_with_index do |option_row, index|
          option = find_or_build_option(attribute, option_row)
          option.assign_attributes(
            label: option_row["label"].to_s.strip,
            price_fitc_override: option_row["price_fitc_override"].presence,
            image_url: option_row["image_url"].presence,
            sort_order: index
          )
          option.save!
          kept_ids << option.id
        end

        attribute.product_attribute_options.where.not(id: kept_ids).destroy_all
      end

      def find_or_build_option(attribute, row)
        if row["id"].present?
          attribute.product_attribute_options.find_by(id: row["id"]) || attribute.product_attribute_options.build
        else
          attribute.product_attribute_options.build
        end
      end
    end
  end
end
