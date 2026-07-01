# frozen_string_literal: true

class TradeOrder < ApplicationRecord
  belongs_to :employee
  belongs_to :product, optional: true
  belongs_to :ledger_debit, class_name: "FitcLedgerEntry", optional: true, inverse_of: :trade_order

  enum :status, {
    confirmed: "confirmed",
    fulfilled: "fulfilled",
    cancelled: "cancelled",
    refunded: "refunded"
  }, validate: true

  validates :product_name, presence: true
  validates :product_price_fitc, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :idempotency_key, length: { maximum: 120 }, allow_blank: true
end
