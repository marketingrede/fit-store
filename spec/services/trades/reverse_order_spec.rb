# frozen_string_literal: true

require "rails_helper"

RSpec.describe Trades::ReverseOrder do
  let(:employee) { create(:employee, wallet_balance: 50) }
  let(:product) { create(:product, price_fitc: 50) }
  let(:trade_order) do
    create(:trade_order, :with_debit, employee:, product:, product_price_fitc: 50, status: "confirmed")
  end

  describe ".call" do
    it "creates reversal ledger entry and credits wallet on cancel" do
      result = described_class.call(trade_order:, status: "cancelled", admin_user_id: 99)

      expect(result.ok).to be(true)
      expect(result.new_balance).to eq(100)
      expect(trade_order.reload.status).to eq("cancelled")
      expect(result.reversal).to have_attributes(
        entry_type: "reversal",
        amount_fitc: 50,
        balance_after_fitc: 100,
        reference_type: "reversal",
        reference_id: trade_order.ledger_debit_id,
        created_by_user_id: 99
      )
      expect(employee.fitc_wallet.reload.balance_fitc).to eq(100)
    end

    it "supports refunded status" do
      result = described_class.call(trade_order:, status: "refunded")

      expect(result.ok).to be(true)
      expect(trade_order.reload.status).to eq("refunded")
    end

    it "rejects already reversed orders" do
      described_class.call(trade_order:, status: "cancelled")

      result = described_class.call(trade_order:, status: "refunded")

      expect(result.ok).to be(false)
      expect(result.error).to eq("Pedido já estornado.")
    end

    it "rejects invalid status" do
      result = described_class.call(trade_order:, status: "fulfilled")

      expect(result.ok).to be(false)
      expect(result.error).to eq("Status de estorno inválido.")
    end
  end
end
