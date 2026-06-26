# frozen_string_literal: true

class TradeOrder < ApplicationRecord
  belongs_to :employee
  belongs_to :product, optional: true
  belongs_to :ledger_debit, class_name: "FitcLedgerEntry", optional: true, inverse_of: :trade_order

  validates :status, presence: true
end
