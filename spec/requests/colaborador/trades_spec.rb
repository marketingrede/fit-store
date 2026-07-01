# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Colaborador trades API", type: :request do
  let(:employee) { create(:employee, wallet_balance: 100) }
  let(:product) { create(:product, :with_size_option, price_fitc: 50) }
  let(:size_attribute) { product.product_attributes.first }
  let(:medium_option) { size_attribute.product_attribute_options.find_by!(label: "M") }

  def sign_in_employee!(employee)
    post colaborador_login_path, params: {
      employee_id: employee.employee_id,
      password: "password123"
    }
  end

  describe "POST /api/colaborador/troca" do
    it "requires authentication" do
      post "/api/colaborador/troca",
           params: { product_id: product.id, product_selection: {} },
           as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body).to eq("ok" => false, "error" => "Não autenticado.")
    end

    it "processes redemption for signed-in employee" do
      sign_in_employee!(employee)

      post "/api/colaborador/troca",
           params: {
             product_id: product.id,
             product_selection: { size_attribute.id.to_s => medium_option.id.to_s }
           },
           as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["ok"]).to be(true)
      expect(body["new_balance"]).to eq(50)
      expect(TradeOrder.count).to eq(1)
    end

    it "does not debit twice when the same idempotency key is retried" do
      sign_in_employee!(employee)
      headers = { "Idempotency-Key" => "redeem-#{SecureRandom.uuid}" }
      params = {
        product_id: product.id,
        product_selection: { size_attribute.id.to_s => medium_option.id.to_s }
      }

      post "/api/colaborador/troca", params:, headers:, as: :json
      first_response = response.parsed_body

      post "/api/colaborador/troca", params:, headers:, as: :json
      second_response = response.parsed_body

      expect(response).to have_http_status(:ok)
      expect(first_response["order_id"]).to eq(second_response["order_id"])
      expect(second_response["new_balance"]).to eq(50)
      expect(employee.fitc_wallet.reload.balance_fitc).to eq(50)
      expect(TradeOrder.count).to eq(1)
      expect(FitcLedgerEntry.where(entry_type: "debit").count).to eq(1)
    end

    it "returns error for insufficient balance" do
      employee.fitc_wallet.update!(balance_fitc: 10)
      sign_in_employee!(employee)

      post "/api/colaborador/troca",
           params: {
             product_id: product.id,
             product_selection: { size_attribute.id.to_s => medium_option.id.to_s }
           },
           as: :json

      expect(response).to have_http_status(:payment_required)
      expect(response.parsed_body["error"]).to include("Saldo insuficiente")
    end
  end
end
