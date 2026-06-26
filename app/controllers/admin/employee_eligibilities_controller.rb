# frozen_string_literal: true

module Admin
  class EmployeeEligibilitiesController < BaseController
    before_action :set_eligibility, only: %i[edit update destroy]

    def index
      @eligibilities = EmployeeEligibility.order(:full_name)
      @status_filter = params[:status]
      @eligibilities = @eligibilities.where(status: @status_filter) if @status_filter.present?
    end

    def new
      @eligibility = EmployeeEligibility.new(status: "active", imported_at: Time.current)
    end

    def create
      @eligibility = EmployeeEligibility.new(eligibility_params)
      @eligibility.imported_at ||= Time.current

      if @eligibility.save
        redirect_to admin_employee_eligibilities_path, notice: "Elegibilidade criada."
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit; end

    def update
      if @eligibility.update(eligibility_params)
        redirect_to admin_employee_eligibilities_path, notice: "Elegibilidade atualizada."
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      if @eligibility.employee.present?
        redirect_to admin_employee_eligibilities_path, alert: "Não é possível excluir: colaborador já cadastrado."
      else
        @eligibility.destroy!
        redirect_to admin_employee_eligibilities_path, notice: "Elegibilidade excluída."
      end
    end

    private

    def set_eligibility
      @eligibility = EmployeeEligibility.find(params[:id])
    end

    def eligibility_params
      params.require(:employee_eligibility).permit(
        :employee_id, :full_name, :email, :department, :status,
        :initial_balance_fitc, :notes
      )
    end
  end
end
