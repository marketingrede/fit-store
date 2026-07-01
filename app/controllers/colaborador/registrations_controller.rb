# frozen_string_literal: true

module Colaborador
  class RegistrationsController < ApplicationController
    include EmployeeAuthenticatable

    layout "application"

    before_action :redirect_if_employee_signed_in!, only: %i[new create]

    def new
      render inertia: "Employee/Register"
    end

    def create
      employee_id = params[:employee_id].to_s.strip
      email = params[:email].to_s.strip
      password = params[:password].to_s
      password_confirm = params[:password_confirm].to_s
      password_confirm = params[:password_confirmation].to_s if password_confirm.blank?

      if employee_id.blank? || email.blank? || password.blank?
        return registration_failure("Preencha todos os campos.", :unprocessable_entity)
      end

      if password != password_confirm
        return registration_failure("As senhas não coincidem.", :unprocessable_entity)
      end

      if password.length < 8
        return registration_failure("A senha deve ter no mínimo 8 caracteres.", :unprocessable_entity)
      end

      eligibility = EmployeeEligibility.active.find_by(employee_id: employee_id)

      unless eligibility
        return registration_failure("Matrícula não autorizada para cadastro.", :forbidden)
      end

      if eligibility.employee.present?
        return registration_failure("Esta matrícula já possui uma conta cadastrada.", :conflict)
      end

      if Employee.exists?(email: email)
        return registration_failure("Este e-mail já está em uso.", :conflict)
      end

      ActiveRecord::Base.transaction do
        employee = Employee.create!(
          employee_eligibility: eligibility,
          employee_id: employee_id,
          email: email,
          password: password,
          full_name: eligibility.full_name
        )

        initial_balance = eligibility.initial_balance_fitc
        FitcWallet.create!(employee: employee, balance_fitc: initial_balance)

        if initial_balance.positive?
          FitcLedgerEntry.create!(
            employee: employee,
            entry_type: "credit",
            amount_fitc: initial_balance,
            balance_after_fitc: initial_balance,
            reference_type: "registration",
            description: "Saldo inicial na ativação da conta"
          )
        end

        eligibility.mark_registered!
      end

      redirect_to colaborador_login_path, notice: "Conta criada com sucesso! Faça login para acessar.", status: :see_other
    rescue ActiveRecord::RecordInvalid => e
      registration_failure(e.record.errors.full_messages.to_sentence, :unprocessable_entity)
    end

    private

    def registration_failure(message, _status)
      redirect_to colaborador_cadastro_path, alert: message, status: :see_other
    end
  end
end
