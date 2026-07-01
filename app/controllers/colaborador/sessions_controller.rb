# frozen_string_literal: true

module Colaborador
  class SessionsController < ApplicationController
    include EmployeeAuthenticatable

    layout "application"

    before_action :redirect_if_employee_signed_in!, only: %i[new create]

    def new
      render inertia: "Employee/Login", props: {
        return_to: safe_return_to
      }
    end

    def create
      if employee_login_locked?
        return login_failure("Muitas tentativas. Aguarde 15 minutos e tente novamente.", :too_many_requests)
      end

      employee = Employee.find_by(employee_id: params[:employee_id].to_s.strip)

      if employee&.authenticate(params[:password].to_s)
        clear_employee_login_lockout!
        reset_session
        sign_in_employee!(employee)
        redirect_to after_login_path, status: :see_other
      else
        register_employee_failed_attempt!
        login_failure("Matrícula ou senha incorretos.", :unauthorized)
      end
    end

    def destroy
      sign_out_employee!
      redirect_to root_path, status: :see_other
    end

    private

    def after_login_path
      safe_return_to || colaborador_root_path
    end

    def safe_return_to
      target = params[:return_to].to_s.strip
      return if target.blank?
      return unless target.start_with?("/")
      return if target.start_with?("//")

      uri = URI.parse(target)
      return unless uri.host.nil?

      path = uri.path.to_s
      return target if path == "/" || path.start_with?("/colaborador")

      nil
    rescue URI::InvalidURIError
      nil
    end

    def login_failure(message, _status)
      redirect_to colaborador_login_path(return_to: params[:return_to]), alert: message, status: :see_other
    end
  end
end
