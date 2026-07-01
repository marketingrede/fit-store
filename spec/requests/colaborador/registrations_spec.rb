# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Colaborador registrations", type: :request do
  let(:inertia_headers) do
    { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
  end

  describe "GET /colaborador/cadastro" do
    it "renders the registration Inertia page" do
      get colaborador_cadastro_path, headers: inertia_headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["component"]).to eq("Employee/Register")
    end
  end

  describe "POST /colaborador/registro" do
    it "creates an employee account with initial wallet and ledger credit" do
      eligibility = create(:employee_eligibility, initial_balance_fitc: 120)

      expect do
        post colaborador_registro_path, params: {
          employee_id: eligibility.employee_id,
          email: "novo@example.com",
          password: "password123",
          password_confirmation: "password123"
        }
      end.to change(Employee, :count).by(1)
        .and change(FitcWallet, :count).by(1)
        .and change(FitcLedgerEntry, :count).by(1)

      employee = Employee.last
      expect(response).to redirect_to(colaborador_login_path)
      expect(employee.employee_eligibility).to eq(eligibility)
      expect(employee.fitc_wallet.balance_fitc).to eq(120)
      expect(employee.fitc_ledger_entries.last).to have_attributes(
        entry_type: "credit",
        amount_fitc: 120,
        balance_after_fitc: 120,
        reference_type: "registration"
      )
      expect(eligibility.reload.registered_at).to be_present
    end

    it "rejects an employee id that is not eligible" do
      expect do
        post colaborador_registro_path, params: {
          employee_id: "NAO-ELEGIVEL",
          email: "novo@example.com",
          password: "password123",
          password_confirmation: "password123"
        }
      end.not_to change(Employee, :count)

      expect(response).to redirect_to(colaborador_cadastro_path)
      expect(flash[:alert]).to eq("Matrícula não autorizada para cadastro.")
    end

    it "rejects duplicated registration for the same eligibility" do
      employee = create(:employee)

      expect do
        post colaborador_registro_path, params: {
          employee_id: employee.employee_id,
          email: "outro@example.com",
          password: "password123",
          password_confirmation: "password123"
        }
      end.not_to change(Employee, :count)

      expect(response).to redirect_to(colaborador_cadastro_path)
      expect(flash[:alert]).to eq("Esta matrícula já possui uma conta cadastrada.")
    end

    it "rejects password confirmation mismatch" do
      eligibility = create(:employee_eligibility)

      post colaborador_registro_path, params: {
        employee_id: eligibility.employee_id,
        email: "novo@example.com",
        password: "password123",
        password_confirmation: "different"
      }

      expect(response).to redirect_to(colaborador_cadastro_path)
      expect(flash[:alert]).to eq("As senhas não coincidem.")
    end
  end
end
