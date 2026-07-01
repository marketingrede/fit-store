# frozen_string_literal: true

module FitcWallets
  class AdjustBalance
    ALLOWED_TYPES = %w[credit debit].freeze

    Result = Data.define(:ok, :error, :ledger_entry, :new_balance) do
      def self.failure(error)
        new(ok: false, error:, ledger_entry: nil, new_balance: nil)
      end

      def self.success(ledger_entry:, new_balance:)
        new(ok: true, error: nil, ledger_entry:, new_balance:)
      end
    end

    def self.call(employee:, adjustment_type:, amount:, description: nil, admin_user_id: nil)
      new(
        employee:,
        adjustment_type:,
        amount:,
        description:,
        admin_user_id:
      ).call
    end

    def initialize(employee:, adjustment_type:, amount:, description: nil, admin_user_id: nil)
      @employee = employee
      @adjustment_type = adjustment_type.to_s
      @amount = amount.to_i
      @description = description
      @admin_user_id = admin_user_id
    end

    def call
      return Result.failure("Colaborador não encontrado.") unless employee
      return Result.failure("Valor inválido.") unless amount.positive?
      return Result.failure("Tipo de ajuste inválido.") unless ALLOWED_TYPES.include?(adjustment_type)

      ledger_entry = nil
      new_balance = nil

      ActiveRecord::Base.transaction do
        wallet = employee.fitc_wallet.lock!

        if adjustment_type == "debit" && wallet.balance_fitc < amount
          raise ActiveRecord::Rollback
        end

        new_balance = if adjustment_type == "credit"
                        wallet.balance_fitc + amount
        else
                        wallet.balance_fitc - amount
        end

        wallet.update!(balance_fitc: new_balance)

        ledger_entry = FitcLedgerEntry.create!(
          employee:,
          entry_type: adjustment_type,
          amount_fitc: amount,
          balance_after_fitc: new_balance,
          reference_type: "manual_adjustment",
          description: description.presence || default_description,
          created_by_user_id: admin_user_id
        )
      end

      return Result.failure("Saldo insuficiente para débito.") if ledger_entry.nil?

      Result.success(ledger_entry:, new_balance:)
    rescue StandardError
      Result.failure("Erro ao ajustar saldo.")
    end

    private

    attr_reader :employee, :adjustment_type, :amount, :description, :admin_user_id

    def default_description
      if adjustment_type == "credit"
        "Crédito manual pelo administrador"
      else
        "Débito manual pelo administrador"
      end
    end
  end
end
