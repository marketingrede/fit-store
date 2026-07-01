# frozen_string_literal: true

module Colaborador
  class StatementsController < BaseController
    def index
      entries = current_employee.fitc_ledger_entries.order(created_at: :desc).limit(100)

      render inertia: "Employee/Statement", props: {
        balanceFitc: current_employee.fitc_wallet.balance_fitc,
        entries: entries.map { |entry| serialize_entry(entry) }
      }
    end

    private

    def serialize_entry(entry)
      entry.slice(:id, :entry_type, :amount_fitc, :balance_after_fitc, :description, :created_at)
    end
  end
end
