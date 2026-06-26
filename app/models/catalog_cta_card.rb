# frozen_string_literal: true

class CatalogCtaCard < ApplicationRecord
  SLOTS = (1..2).freeze

  validates :slot, presence: true, uniqueness: true, inclusion: { in: SLOTS }
  validates :variant, presence: true
end
