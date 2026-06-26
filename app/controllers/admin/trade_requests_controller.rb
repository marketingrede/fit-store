# frozen_string_literal: true

module Admin
  class TradeRequestsController < BaseController
    def index
      @trade_requests = TradeRequest.includes(:product).order(created_at: :desc)
    end
  end
end
