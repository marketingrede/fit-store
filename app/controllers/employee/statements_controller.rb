# frozen_string_literal: true

module Employee
  class StatementsController < BaseController
    def index
      @entries = current_employee.fitc_ledger_entries.order(created_at: :desc).limit(100)
      @balance = current_employee.fitc_wallet.balance_fitc
      @page_props = {
        balance: @balance,
        entries: @entries.map { |e| serialize_entry(e) }
      }

      respond_to do |format|
        format.html
        format.json { render json: @page_props.merge(inertia_share) }
      end
    end

    private

    def serialize_entry(entry)
      entry.slice(:id, :entry_type, :amount_fitc, :balance_after_fitc, :description, :created_at)
    end
  end
end
