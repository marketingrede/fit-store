# frozen_string_literal: true

module Trades
  class ProcessRedemption
    Result = Data.define(:ok, :error, :order, :new_balance) do
      def self.failure(error)
        new(ok: false, error:, order: nil, new_balance: nil)
      end

      def self.success(order:, new_balance:)
        new(ok: true, error: nil, order:, new_balance:)
      end
    end

    def self.call(employee:, product:, selection:, idempotency_key: nil)
      new(employee:, product:, selection:, idempotency_key:).call
    end

    def initialize(employee:, product:, selection:, idempotency_key: nil)
      @employee = employee
      @product = product
      @selection = selection
      @idempotency_key = idempotency_key.to_s.strip.presence
    end

    def call
      existing_order = find_idempotent_order
      return idempotent_success(existing_order) if existing_order

      return Result.failure("Produto não encontrado ou inativo.") unless product&.active?

      validation = Products::SelectionValidator.call(product:, selection:)
      return Result.failure(validation.error) unless validation.ok

      final_price = validation.price_fitc

      order = nil
      new_balance = nil
      insufficient_balance = nil

      ActiveRecord::Base.transaction do
        wallet = employee.fitc_wallet.lock!

        if wallet.balance_fitc < final_price
          insufficient_balance = wallet.balance_fitc
          raise ActiveRecord::Rollback
        end

        wallet.update!(balance_fitc: wallet.balance_fitc - final_price)
        new_balance = wallet.balance_fitc

        ledger = FitcLedgerEntry.create!(
          employee:,
          entry_type: "debit",
          amount_fitc: final_price,
          balance_after_fitc: new_balance,
          reference_type: "trade_order",
          description: "Resgate: #{product.name}"
        )

        order = TradeOrder.create!(
          employee:,
          product:,
          product_name: product.name,
          product_price_fitc: final_price,
          product_selection_json: selection_payload(validation.summary),
          status: "confirmed",
          ledger_debit: ledger,
          idempotency_key:
        )

        ledger.update!(reference_id: order.id)
      end

      return Result.failure(insufficient_balance_message(insufficient_balance)) if order.nil?

      Result.success(order:, new_balance:)
    rescue ActiveRecord::RecordNotUnique
      existing_order = find_idempotent_order
      existing_order ? idempotent_success(existing_order) : Result.failure("Erro ao processar resgate.")
    rescue StandardError
      Result.failure("Erro ao processar resgate.")
    end

    private

    attr_reader :employee, :product, :selection, :idempotency_key

    def find_idempotent_order
      return if idempotency_key.blank?

      employee.trade_orders.find_by(idempotency_key:)
    end

    def idempotent_success(order)
      new_balance = order.ledger_debit&.balance_after_fitc || employee.fitc_wallet&.balance_fitc.to_i

      Result.success(order:, new_balance:)
    end

    def selection_payload(summary)
      {
        choices: summary,
        raw: selection
      }.to_json
    end

    def insufficient_balance_message(balance)
      "Saldo insuficiente. Seu saldo: #{balance} FITC."
    end
  end
end
