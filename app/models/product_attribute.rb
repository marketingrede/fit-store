# frozen_string_literal: true

class ProductAttribute < ApplicationRecord
  belongs_to :product
  has_many :product_attribute_options, -> { order(:sort_order, :id) }, dependent: :destroy
end
