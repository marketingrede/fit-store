# frozen_string_literal: true

module Employee
  class RegistrationsController < ApplicationController
    include EmployeeAuthenticatable

    layout "employee"

    before_action :redirect_if_employee_signed_in!, only: %i[new create]

    def new
      @error = flash[:alert]
      @success = flash[:notice]
    end

    def create
      employee_id = params[:employee_id].to_s.strip
      email = params[:email].to_s.strip
      password = params[:password].to_s
      password_confirm = params[:password_confirm].to_s

      if employee_id.blank? || email.blank? || password.blank?
        flash.now[:alert] = "Preencha todos os campos."
        return render :new, status: :unprocessable_entity
      end

      if password != password_confirm
        flash.now[:alert] = "As senhas não coincidem."
        return render :new, status: :unprocessable_entity
      end

      if password.length < 8
        flash.now[:alert] = "A senha deve ter no mínimo 8 caracteres."
        return render :new, status: :unprocessable_entity
      end

      eligibility = EmployeeEligibility.active.find_by(employee_id: employee_id)

      unless eligibility
        flash.now[:alert] = "Matrícula não autorizada para cadastro."
        return render :new, status: :forbidden
      end

      if eligibility.employee.present?
        flash.now[:alert] = "Esta matrícula já possui uma conta cadastrada."
        return render :new, status: :conflict
      end

      if Employee.exists?(email: email)
        flash.now[:alert] = "Este e-mail já está em uso."
        return render :new, status: :conflict
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

      flash[:notice] = "Conta criada com sucesso! Faça login para acessar."
      redirect_to colaborador_login_path
    rescue ActiveRecord::RecordInvalid => e
      flash.now[:alert] = e.record.errors.full_messages.to_sentence
      render :new, status: :unprocessable_entity
    end
  end
end
