# frozen_string_literal: true

class VariationPreset < ApplicationRecord
  validates :name, presence: true
  validates :sort_order, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :options_json_must_be_array

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:sort_order, :id) }

  def options
    JSON.parse(options_json)
  rescue JSON::ParserError
    []
  end

  def options=(value)
    self.options_json = value.to_json
  end

  private

  def options_json_must_be_array
    parsed = JSON.parse(options_json)
    errors.add(:options_json, "deve ser um array JSON") unless parsed.is_a?(Array)
  rescue JSON::ParserError
    errors.add(:options_json, "deve ser JSON válido")
  end
end
