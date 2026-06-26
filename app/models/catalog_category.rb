# frozen_string_literal: true

class CatalogCategory < ApplicationRecord
  validates :slug, presence: true, uniqueness: true,
                   format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }
  validates :label, presence: true
  validates :sort_order, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:sort_order, :id) }
end
