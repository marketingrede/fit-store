# frozen_string_literal: true

module EmployeeAuthenticatable
  extend ActiveSupport::Concern
  include LoginLockout

  included do
    helper_method :current_employee if respond_to?(:helper_method)
  end

  private

  def require_employee!
    return if current_employee

    redirect_to colaborador_login_path, alert: "Faça login para continuar."
  end

  def redirect_if_employee_signed_in!
    redirect_to colaborador_root_path if current_employee
  end

  def employee_login_locked?
    login_locked?(attempts_key: :emp_login_attempts, locked_until_key: :emp_login_locked_until)
  end

  def register_employee_failed_attempt!
    register_failed_login_attempt!(
      attempts_key: :emp_login_attempts,
      locked_until_key: :emp_login_locked_until
    )
  end

  def clear_employee_login_lockout!
    clear_login_lockout!(attempts_key: :emp_login_attempts, locked_until_key: :emp_login_locked_until)
  end

  def sign_in_employee!(employee)
    session[:employee_id] = employee.id
    session[:employee_matricula] = employee.employee_id
    session[:employee_name] = employee.full_name
    employee.update_column(:last_login_at, Time.current)
  end

  def sign_out_employee!
    session.delete(:employee_id)
    session.delete(:employee_matricula)
    session.delete(:employee_name)
  end
end
