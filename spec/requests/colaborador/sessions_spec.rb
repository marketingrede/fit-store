# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Colaborador sessions", type: :request do
  let(:employee) { create(:employee, wallet_balance: 120) }
  let(:inertia_headers) do
    { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
  end

  describe "GET /colaborador/login" do
    it "renders the login Inertia page" do
      get colaborador_login_path, headers: inertia_headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["component"]).to eq("Employee/Login")
    end
  end

  describe "POST /colaborador/login" do
    it "signs in with valid credentials" do
      post colaborador_login_path, params: {
        employee_id: employee.employee_id,
        password: "password123"
      }

      expect(response).to redirect_to(colaborador_root_path)
      expect(session[:employee_id]).to eq(employee.id)
    end

    it "redirects to return_to when safe" do
      post colaborador_login_path, params: {
        employee_id: employee.employee_id,
        password: "password123",
        return_to: "/colaborador/resgates"
      }

      expect(response).to redirect_to("/colaborador/resgates")
    end

    it "rejects invalid credentials" do
      post colaborador_login_path, params: {
        employee_id: employee.employee_id,
        password: "wrong-password"
      }

      expect(response).to redirect_to(colaborador_login_path)
      expect(session[:employee_id]).to be_nil
    end
  end

  describe "POST /colaborador/logout" do
    it "clears the session" do
      post colaborador_login_path, params: {
        employee_id: employee.employee_id,
        password: "password123"
      }

      post colaborador_logout_path

      expect(response).to redirect_to(root_path)
      expect(session[:employee_id]).to be_nil
    end
  end
end
