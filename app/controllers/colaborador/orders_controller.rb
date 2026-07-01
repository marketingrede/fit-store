# frozen_string_literal: true

module Colaborador
  class OrdersController < BaseController
    def index
      orders = current_employee.trade_orders.order(created_at: :desc)

      render inertia: "Employee/Orders", props: {
        orders: orders.map { |order| serialize_order(order) }
      }
    end

    private

    def serialize_order(order)
      order.slice(
        :id, :product_name, :product_price_fitc, :product_selection_json,
        :status, :fulfillment_notes, :created_at
      )
    end
  end
end
