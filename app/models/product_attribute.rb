# frozen_string_literal: true

class ProductAttribute < ApplicationRecord
  belongs_to :product
  has_many :product_attribute_options, -> { order(:sort_order, :id) }, dependent: :destroy

  validates :name, presence: true
  validates :sort_order, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
