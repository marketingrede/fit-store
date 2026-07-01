# frozen_string_literal: true

module Colaborador
  class ProfileController < BaseController
    def show
      wallet = current_employee.fitc_wallet
      recent_orders = current_employee.trade_orders.order(created_at: :desc).limit(5)

      render inertia: "Employee/Profile", props: {
        employee: current_employee.slice(:id, :employee_id, :full_name, :email),
        balanceFitc: wallet.balance_fitc,
        recent_orders: recent_orders.map { |order| serialize_order(order) }
      }
    end

    private

    def serialize_order(order)
      order.slice(:id, :product_name, :product_price_fitc, :status, :created_at)
    end
  end
end
