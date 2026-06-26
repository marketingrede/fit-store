# frozen_string_literal: true

module Trades
  class ReverseOrder
    REVERSIBLE_STATUSES = %w[cancelled refunded].freeze

    Result = Data.define(:ok, :error, :order, :reversal, :new_balance) do
      def self.failure(error)
        new(ok: false, error:, order: nil, reversal: nil, new_balance: nil)
      end

      def self.success(order:, reversal:, new_balance:)
        new(ok: true, error: nil, order:, reversal:, new_balance:)
      end
    end

    def self.call(trade_order:, status:, admin_user_id: nil)
      new(trade_order:, status:, admin_user_id:).call
    end

    def initialize(trade_order:, status:, admin_user_id: nil)
      @trade_order = trade_order
      @status = status.to_s
      @admin_user_id = admin_user_id
    end

    def call
      return Result.failure("Pedido não encontrado.") unless trade_order
      return Result.failure("Status de estorno inválido.") unless REVERSIBLE_STATUSES.include?(status)
      return Result.failure("Pedido já estornado.") unless trade_order.status == "confirmed"
      return Result.failure("Pedido sem débito vinculado.") unless trade_order.ledger_debit_id

      reversal = nil
      new_balance = nil

      ActiveRecord::Base.transaction do
        wallet = trade_order.employee.fitc_wallet.lock!
        amount = trade_order.product_price_fitc

        wallet.update!(balance_fitc: wallet.balance_fitc + amount)
        new_balance = wallet.balance_fitc

        reversal = FitcLedgerEntry.create!(
          employee: trade_order.employee,
          entry_type: "reversal",
          amount_fitc: amount,
          balance_after_fitc: new_balance,
          reference_type: "reversal",
          reference_id: trade_order.ledger_debit_id,
          description: "Estorno: #{trade_order.product_name}",
          created_by_user_id: admin_user_id
        )

        trade_order.update!(status:)
      end

      Result.success(order: trade_order, reversal:, new_balance:)
    rescue StandardError
      Result.failure("Erro ao estornar pedido.")
    end

    private

    attr_reader :trade_order, :status, :admin_user_id
  end
end
