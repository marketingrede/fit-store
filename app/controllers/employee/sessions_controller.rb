# frozen_string_literal: true

module Employee
  class SessionsController < ApplicationController
    include EmployeeAuthenticatable

    layout "employee"

    before_action :redirect_if_employee_signed_in!, only: %i[new create]

    def new
      @error = flash[:alert]
    end

    def create
      if employee_login_locked?
        flash.now[:alert] = "Muitas tentativas. Aguarde 15 minutos e tente novamente."
        return render :new, status: :too_many_requests
      end

      employee = Employee.find_by(employee_id: params[:employee_id].to_s.strip)

      if employee&.authenticate(params[:password].to_s)
        clear_employee_login_lockout!
        reset_session
        sign_in_employee!(employee)
        redirect_to colaborador_root_path
      else
        register_employee_failed_attempt!
        flash.now[:alert] = "Matrícula ou senha incorretos."
        render :new, status: :unauthorized
      end
    end

    def destroy
      sign_out_employee!
      redirect_to colaborador_login_path
    end
  end
end
