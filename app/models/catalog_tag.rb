# frozen_string_literal: true

class CatalogTag < ApplicationRecord
  validates :name, presence: true, uniqueness: { case_sensitive: false }
  validates :sort_order, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :color, format: { with: /\A#[0-9a-fA-F]{6}\z/ }, allow_blank: true

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:sort_order, :id) }

  normalizes :name, with: ->(name) { name.strip }
end
