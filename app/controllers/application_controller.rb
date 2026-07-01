# frozen_string_literal: true

class ApplicationController < ActionController::Base
  inertia_share do
    {
      auth: {
        admin: current_user&.slice(:id, :email, :role),
        employee: serialize_employee_auth
      },
      flash: flash.to_hash
    }
  end

  helper_method :current_user, :current_employee, :inertia_share

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def current_employee
    @current_employee ||= Employee.includes(:fitc_wallet).find_by(id: session[:employee_id]) if session[:employee_id]
  end

  def inertia_share
    {
      auth: {
        admin: current_user&.slice(:id, :email, :role),
        employee: serialize_employee_auth
      },
      flash: flash.to_hash
    }
  end

  def serialize_employee_auth
    return unless current_employee

    current_employee.slice(:id, :employee_id, :full_name, :email).merge(
      balance_fitc: current_employee.fitc_wallet&.balance_fitc.to_i
    )
  end
end
