# frozen_string_literal: true

module Admin
  class TradeOrdersController < BaseController
    before_action :set_trade_order, only: :update

    def index
      @orders = TradeOrder.includes(:employee, :product).order(created_at: :desc)
      @status_filter = params[:status]
      @orders = @orders.where(status: @status_filter) if @status_filter.present?
    end

    def update
      new_status = params.dig(:trade_order, :status).to_s

      if Trades::ReverseOrder::REVERSIBLE_STATUSES.include?(new_status)
        result = Trades::ReverseOrder.call(
          trade_order: @trade_order,
          status: new_status,
          admin_user_id: current_user.id
        )

        if result.ok
          redirect_to admin_trade_orders_path, notice: "Pedido estornado (#{new_status})."
        else
          redirect_to admin_trade_orders_path, alert: result.error
        end
      else
        if @trade_order.update(trade_order_params)
          redirect_to admin_trade_orders_path, notice: "Status atualizado."
        else
          redirect_to admin_trade_orders_path, alert: @trade_order.errors.full_messages.to_sentence
        end
      end
    end

    private

    def set_trade_order
      @trade_order = TradeOrder.find(params[:id])
    end

    def trade_order_params
      params.require(:trade_order).permit(:status, :fulfillment_notes)
    end
  end
end
