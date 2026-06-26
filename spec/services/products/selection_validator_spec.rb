# frozen_string_literal: true

require "rails_helper"

RSpec.describe Products::SelectionValidator do
  describe ".validate" do
    let(:attributes) do
      [
        {
          id: 1,
          name: "Tamanho",
          unit: nil,
          required: true,
          options: [
            { id: 10, label: "M", price_fitc_override: nil },
            { id: 11, label: "G", price_fitc_override: 80 }
          ]
        }
      ]
    end

    it "returns success with base price when optional attribute is omitted" do
      optional_attributes = [ attributes.first.merge(required: false) ]
      result = described_class.validate(optional_attributes, {}, 50)

      expect(result.ok).to be(true)
      expect(result.price_fitc).to eq(50)
      expect(result.summary).to eq([])
    end

    it "returns error when required attribute is missing" do
      result = described_class.validate(attributes, {}, 50)

      expect(result.ok).to be(false)
      expect(result.error).to eq("Selecione a opção obrigatória: Tamanho.")
    end

    it "returns error for invalid option" do
      result = described_class.validate(attributes, { "1" => "999" }, 50)

      expect(result.ok).to be(false)
      expect(result.error).to eq("Opção de variação inválida.")
    end

    it "builds summary and applies price override" do
      result = described_class.validate(attributes, { "1" => "11" }, 50)

      expect(result.ok).to be(true)
      expect(result.summary).to eq([ { attribute: "Tamanho", label: "G" } ])
      expect(result.price_fitc).to eq(80)
    end

    it "appends unit to label when present" do
      attributes_with_unit = [
        attributes.first.merge(unit: "cm", options: [ { id: 10, label: "42", price_fitc_override: nil } ])
      ]

      result = described_class.validate(attributes_with_unit, { "1" => "10" }, 50)

      expect(result.summary).to eq([ { attribute: "Tamanho", label: "42 cm" } ])
    end
  end

  describe ".validate_admin_definition" do
    it "accepts valid attribute definitions" do
      result = described_class.validate_admin_definition(
        [ { name: "Cor", options: [ { label: "Azul" } ] } ]
      )

      expect(result.ok).to be(true)
    end

    it "rejects attribute without options" do
      result = described_class.validate_admin_definition(
        [ { name: "Cor", options: [] } ]
      )

      expect(result.ok).to be(false)
      expect(result.error).to eq('A variação "Cor" precisa de ao menos uma opção.')
    end
  end

  describe ".call" do
    let(:product) { create(:product, :with_size_option, price_fitc: 50) }
    let(:size_attribute) { product.product_attributes.first }
    let(:medium_option) { size_attribute.product_attribute_options.find_by!(label: "M") }

    it "validates selection using product associations" do
      result = described_class.call(product:, selection: { size_attribute.id => medium_option.id })

      expect(result.ok).to be(true)
      expect(result.price_fitc).to eq(50)
      expect(result.summary).to eq([ { attribute: "Tamanho", label: "M" } ])
    end
  end
end
