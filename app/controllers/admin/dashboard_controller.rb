# frozen_string_literal: true

module Admin
  class DashboardController < BaseController
    def index
      @stats = {
        products_total: Product.count,
        products_active: Product.active.count,
        products_inactive: Product.where(active: false).count,
        trade_orders_total: TradeOrder.count,
        trade_orders_confirmed: TradeOrder.where(status: "confirmed").count,
        employees_total: Employee.count,
        eligibilities_pending: EmployeeEligibility.active.where.missing(:employee).count,
        fitc_total: FitcWallet.sum(:balance_fitc),
        trade_requests_total: TradeRequest.count,
        announcements_published: Announcement.published.count,
        announcements_draft: Announcement.draft.count
      }
      @recent_trade_requests = TradeRequest.order(created_at: :desc).limit(8)
      @recent_orders = TradeOrder.includes(:employee).order(created_at: :desc).limit(8)
      @products_by_category = Product.group(:category).count
    end

    def employees
      @stats = {
        total_eligible: EmployeeEligibility.count,
        active_eligible: EmployeeEligibility.active.count,
        registered: Employee.count,
        total_balance: FitcWallet.sum(:balance_fitc),
        total_orders: TradeOrder.count
      }
    end
  end
end
