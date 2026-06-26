# frozen_string_literal: true

module Employee
  class OrdersController < BaseController
    def index
      @orders = current_employee.trade_orders.order(created_at: :desc)
      @page_props = {
        orders: @orders.map { |o| serialize_order(o) }
      }

      respond_to do |format|
        format.html
        format.json { render json: @page_props.merge(inertia_share) }
      end
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
