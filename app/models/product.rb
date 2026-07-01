# frozen_string_literal: true

class Product < ApplicationRecord
  has_many :product_attributes, -> { order(:sort_order, :id) }, dependent: :destroy
  has_many :trade_orders, dependent: :restrict_with_exception

  scope :active, -> { where(active: true) }

  validates :name, :category, presence: true
  validates :price_fitc, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
