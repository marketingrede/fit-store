# frozen_string_literal: true

require "rails_helper"

RSpec.describe FitcWallets::AdjustBalance do
  let(:employee) { create(:employee, wallet_balance: 100) }

  describe ".call" do
    it "credits wallet and creates ledger entry" do
      result = described_class.call(
        employee:,
        adjustment_type: "credit",
        amount: 25,
        description: "Bônus mensal",
        admin_user_id: 7
      )

      expect(result.ok).to be(true)
      expect(result.new_balance).to eq(125)
      expect(result.ledger_entry).to have_attributes(
        entry_type: "credit",
        amount_fitc: 25,
        balance_after_fitc: 125,
        reference_type: "manual_adjustment",
        description: "Bônus mensal",
        created_by_user_id: 7
      )
      expect(employee.fitc_wallet.reload.balance_fitc).to eq(125)
    end

    it "debits wallet when balance is sufficient" do
      result = described_class.call(
        employee:,
        adjustment_type: "debit",
        amount: 40
      )

      expect(result.ok).to be(true)
      expect(result.new_balance).to eq(60)
      expect(result.ledger_entry.entry_type).to eq("debit")
      expect(result.ledger_entry.description).to eq("Débito manual pelo administrador")
    end

    it "rejects debit when balance is insufficient" do
      result = described_class.call(
        employee:,
        adjustment_type: "debit",
        amount: 200
      )

      expect(result.ok).to be(false)
      expect(result.error).to eq("Saldo insuficiente para débito.")
      expect(FitcLedgerEntry.count).to eq(0)
      expect(employee.fitc_wallet.reload.balance_fitc).to eq(100)
    end

    it "rejects invalid amount" do
      result = described_class.call(
        employee:,
        adjustment_type: "credit",
        amount: 0
      )

      expect(result.ok).to be(false)
      expect(result.error).to eq("Valor inválido.")
    end
  end
end
