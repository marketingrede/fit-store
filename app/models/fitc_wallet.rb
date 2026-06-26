# frozen_string_literal: true

class FitcWallet < ApplicationRecord
  belongs_to :employee

  validates :balance_fitc, numericality: { greater_than_or_equal_to: 0 }
end
