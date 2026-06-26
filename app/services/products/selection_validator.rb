# frozen_string_literal: true

module Products
  class SelectionValidator
    Result = Data.define(:ok, :error, :summary, :price_fitc) do
      def self.failure(error)
        new(ok: false, error:, summary: nil, price_fitc: nil)
      end

      def self.success(summary:, price_fitc:)
        new(ok: true, error: nil, summary:, price_fitc:)
      end
    end

    def self.call(product:, selection:)
      new(product:, selection:).call
    end

    def self.validate(attributes, selection, base_price)
      new(
        attributes: normalize_attributes(attributes),
        selection:,
        base_price:
      ).validate_attributes
    end

    def self.validate_admin_definition(attributes)
      normalize_attributes(attributes).each do |attr|
        name = attr[:name].to_s.strip
        next if name.blank?

        labels = Array(attr[:options]).filter_map do |option|
          option[:label].to_s.strip.presence
        end

        if labels.empty?
          return Result.failure("A variação \"#{name}\" precisa de ao menos uma opção.")
        end
      end

      Result.success(summary: [], price_fitc: nil)
    end

    def initialize(product: nil, selection: nil, attributes: nil, base_price: nil)
      @product = product
      @selection = selection_for(selection)
      @attributes = attributes
      @base_price = base_price
    end

    def call
      return validate_attributes if @attributes

      validate(
        serialize_product_attributes(@product.product_attributes.includes(:product_attribute_options)),
        @selection,
        @product.price_fitc
      )
    end

    def validate_attributes
      validate(@attributes, @selection, @base_price)
    end

    private

    def validate(attributes, selection, base_price)
      summary = []
      price = base_price
      selection = selection_for(selection)

      attributes.each do |attr|
        attr_id = attr[:id].to_s
        name = attr[:name].to_s
        required = ActiveModel::Type::Boolean.new.cast(attr[:required])
        unit = attr[:unit].to_s.strip
        chosen = selection[attr_id]

        if chosen.blank?
          return Result.failure("Selecione a opção obrigatória: #{name}.") if required

          next
        end

        option = Array(attr[:options]).find { |opt| opt[:id].to_i == chosen.to_i }
        return Result.failure("Opção de variação inválida.") unless option

        label = option[:label].to_s
        label = "#{label} #{unit}" if unit.present?

        summary << { attribute: name, label: }

        if option.key?(:price_fitc_override) && !option[:price_fitc_override].nil?
          price = option[:price_fitc_override].to_i
        end
      end

      Result.success(summary:, price_fitc: price)
    end

    def self.normalize_attributes(attributes)
      Array(attributes).map do |attr|
        attr = attr.to_h.symbolize_keys
        options = Array(attr[:options]).map do |option|
          option.to_h.symbolize_keys.merge(id: option[:id].to_i)
        end

        attr.merge(
          id: attr[:id].to_i,
          name: attr[:name].to_s,
          unit: attr[:unit],
          required: attr[:required],
          options:
        )
      end
    end
    private_class_method :normalize_attributes

    def selection_for(selection)
      selection.to_h.stringify_keys
    end

    def serialize_product_attributes(attributes)
      attributes.map do |attribute|
        {
          id: attribute.id,
          name: attribute.name,
          unit: attribute.unit,
          required: attribute.required,
          options: attribute.product_attribute_options.map do |option|
            {
              id: option.id,
              label: option.label,
              price_fitc_override: option.price_fitc_override
            }
          end
        }
      end
    end
  end
end
