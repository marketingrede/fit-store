# frozen_string_literal: true

module Admin
  class EmployeesController < BaseController
    before_action :set_employee, only: %i[show destroy]

    def index
      @employees = Employee.includes(:fitc_wallet, :employee_eligibility).order(:full_name)
    end

    def show
      @wallet = @employee.fitc_wallet
      @ledger_entries = @employee.fitc_ledger_entries.order(created_at: :desc).limit(50)
      @orders = @employee.trade_orders.order(created_at: :desc).limit(20)
    end

    def destroy
      if @employee.trade_orders.exists? || @employee.fitc_ledger_entries.exists?
        redirect_to admin_employee_path(@employee), alert: "Não é possível excluir: há histórico de transações."
      else
        @employee.destroy!
        redirect_to admin_employees_path, notice: "Conta excluída."
      end
    end

    private

    def set_employee
      @employee = Employee.find(params[:id])
    end
  end
end
