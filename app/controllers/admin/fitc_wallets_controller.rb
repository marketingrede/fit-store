# frozen_string_literal: true

module Admin
  class FitcWalletsController < BaseController
    def index
      @wallets = FitcWallet.includes(:employee).joins(:employee).order("employees.full_name")
      @employees = Employee.order(:full_name)
    end

    def adjust
      employee = Employee.find(params[:employee_id])
      result = FitcWallets::AdjustBalance.call(
        employee: employee,
        adjustment_type: params[:adjustment_type],
        amount: params[:amount],
        description: params[:description],
        admin_user_id: current_user.id
      )

      if result.ok
        redirect_to admin_fitc_wallets_path, notice: "Saldo ajustado. Novo saldo: #{result.new_balance} FITC."
      else
        redirect_to admin_fitc_wallets_path, alert: result.error
      end
    end
  end
end
