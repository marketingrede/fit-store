# frozen_string_literal: true

module Employee
  class TradesController < BaseController
    skip_before_action :require_employee!
    skip_before_action :verify_authenticity_token, only: :create
    before_action :require_employee_json!, only: :create

    def create
      product = Product.active.find_by(id: params[:product_id])
      selection = parse_selection(params[:product_selection])

      result = Trades::ProcessRedemption.call(
        employee: current_employee,
        product: product,
        selection: selection
      )

      if result.ok
        render json: {
          ok: true,
          order_id: result.order.id,
          new_balance: result.new_balance
        }
      else
        status = result.error&.include?("Saldo insuficiente") ? :payment_required : :unprocessable_entity
        render json: { ok: false, error: result.error }, status: status
      end
    end

    private

    def require_employee_json!
      return if current_employee

      render json: { ok: false, error: "Não autenticado." }, status: :unauthorized
    end

    def parse_selection(raw)
      return raw.to_unsafe_h if raw.is_a?(ActionController::Parameters)
      return raw if raw.is_a?(Hash)

      JSON.parse(raw.to_s)
    rescue JSON::ParserError
      {}
    end
  end
end
