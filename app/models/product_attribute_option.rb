# frozen_string_literal: true

class ProductAttributeOption < ApplicationRecord
  belongs_to :product_attribute

  validates :label, presence: true
  validates :price_fitc_override, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :sort_order, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
