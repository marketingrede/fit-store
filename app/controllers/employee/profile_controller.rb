# frozen_string_literal: true

module Employee
  class ProfileController < BaseController
    def show
      @wallet = current_employee.fitc_wallet
      @recent_orders = current_employee.trade_orders.order(created_at: :desc).limit(5)
      @page_props = {
        employee: current_employee.slice(:id, :employee_id, :full_name, :email),
        balance: @wallet.balance_fitc,
        recent_orders: @recent_orders.map { |o| serialize_order(o) }
      }

      respond_to do |format|
        format.html
        format.json { render json: @page_props.merge(inertia_share) }
      end
    end

    private

    def serialize_order(order)
      order.slice(:id, :product_name, :product_price_fitc, :status, :created_at)
    end
  end
end
