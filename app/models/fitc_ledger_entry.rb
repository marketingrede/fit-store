# frozen_string_literal: true

class FitcLedgerEntry < ApplicationRecord
  belongs_to :employee
  belongs_to :created_by_user, class_name: "User", optional: true
  has_one :trade_order, foreign_key: :ledger_debit_id, dependent: :restrict_with_exception, inverse_of: :ledger_debit

  validates :entry_type, presence: true
  validates :amount_fitc, numericality: { greater_than: 0 }
end
