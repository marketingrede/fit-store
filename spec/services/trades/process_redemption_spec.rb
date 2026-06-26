# frozen_string_literal: true

require "rails_helper"

RSpec.describe Trades::ProcessRedemption do
  let(:employee) { create(:employee, wallet_balance: 100) }
  let(:product) { create(:product, :with_size_option, price_fitc: 50) }
  let(:size_attribute) { product.product_attributes.first }
  let(:medium_option) { size_attribute.product_attribute_options.find_by!(label: "M") }
  let(:selection) { { size_attribute.id => medium_option.id } }

  describe ".call" do
    it "processes redemption atomically with wallet lock and ledger debit" do
      result = described_class.call(employee:, product:, selection:)

      expect(result.ok).to be(true)
      expect(result.new_balance).to eq(50)
      expect(result.order).to have_attributes(
        status: "confirmed",
        product_price_fitc: 50,
        employee_id: employee.id
      )

      employee.fitc_wallet.reload
      expect(employee.fitc_wallet.balance_fitc).to eq(50)

      ledger = result.order.ledger_debit
      expect(ledger).to have_attributes(
        entry_type: "debit",
        amount_fitc: 50,
        balance_after_fitc: 50,
        reference_type: "trade_order",
        reference_id: result.order.id
      )
    end

    it "returns error when balance is insufficient" do
      employee.fitc_wallet.update!(balance_fitc: 10)

      result = described_class.call(employee:, product:, selection:)

      expect(result.ok).to be(false)
      expect(result.error).to eq("Saldo insuficiente. Seu saldo: 10 FITC.")
      expect(TradeOrder.count).to eq(0)
      expect(FitcLedgerEntry.count).to eq(0)
      expect(employee.fitc_wallet.reload.balance_fitc).to eq(10)
    end

    it "returns error for inactive product" do
      product.update!(active: false)

      result = described_class.call(employee:, product:, selection:)

      expect(result.ok).to be(false)
      expect(result.error).to eq("Produto não encontrado ou inativo.")
    end

    it "returns error for invalid selection" do
      result = described_class.call(employee:, product:, selection: {})

      expect(result.ok).to be(false)
      expect(result.error).to eq("Selecione a opção obrigatória: Tamanho.")
    end
  end
end
