# frozen_string_literal: true

module Admin
  class DashboardController < BaseController
    def index
      period = 29.days.ago.beginning_of_day..Time.current
      recent_counts = TradeOrder.where(created_at: period).group("DATE(created_at)").count
      last_30_trade_orders = TradeOrder.where(created_at: period)

      @stats = dashboard_stats(period:, last_30_trade_orders:)
      @recent_trade_requests = TradeRequest.order(created_at: :desc).limit(8)
      @recent_orders = TradeOrder.includes(:employee).order(created_at: :desc).limit(8)
      @trade_order_days = 29.downto(0).map do |days_ago|
        date = Date.current - days_ago
        { label: I18n.l(date, format: "%d/%m"), value: recent_counts.fetch(date.to_s, 0) }
      end
      @top_products = TradeOrder.group(:product_name).order(Arel.sql("COUNT(*) DESC")).limit(5).count
      @products_by_category = Product.group(:category).count.sort_by { |_category, total| -total }.to_h
      @catalog_status = {
        active: @stats[:products_active],
        inactive: @stats[:products_inactive]
      }
      @catalog_summary = catalog_summary
      @chart_payload = chart_payload
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

    def reports
      @report_cards = report_cards
      @selected_report = report_key(params[:report])
      @date_from = parse_report_date(params[:from], default: 30.days.ago.to_date)
      @date_to = parse_report_date(params[:to], default: Date.current)
      rows = report_rows_for(@selected_report, from: @date_from, to: @date_to)
      @report_headers = rows.first || []
      @preview_rows = rows.drop(1).first(5)
      @preview_filename = "movimenta-#{@selected_report}-#{@date_from}-#{@date_to}.csv"

      return unless request.format.csv?

      send_data(
        csv_document(rows),
        filename: @preview_filename,
        type: "text/csv; charset=utf-8"
      )
    end

    def catalog_settings
      @catalog_summary = catalog_summary
    end

    private

    def dashboard_stats(period:, last_30_trade_orders:)
      {
        products_total: Product.count,
        products_active: Product.active.count,
        products_inactive: Product.where(active: false).count,
        products_with_image: Product.where.not(image_url: [ nil, "" ]).count,
        trade_orders_total: TradeOrder.count,
        trade_orders_last_30: last_30_trade_orders.count,
        trade_orders_last_7: TradeOrder.where(created_at: 6.days.ago.beginning_of_day..Time.current).count,
        trade_orders_confirmed: TradeOrder.where(status: "confirmed").count,
        employees_total: Employee.count,
        eligibilities_pending: EmployeeEligibility.active.where.missing(:employee).count,
        fitc_wallet_total: FitcWallet.sum(:balance_fitc),
        fitc_redeemed_last_30: TradeOrder.where(created_at: period, status: "confirmed").sum(:product_price_fitc),
        trade_requests_total: TradeRequest.count,
        announcements_total: Announcement.count,
        announcements_published: Announcement.published.count,
        announcements_draft: Announcement.draft.count
      }
    end

    def catalog_summary
      {
        active_categories: CatalogCategory.active.count,
        active_tags: CatalogTag.active.count,
        active_variations: VariationPreset.active.count,
        active_cta_cards: CatalogCtaCard.where(active: true).count,
        products_with_image: Product.where.not(image_url: [ nil, "" ]).count
      }
    end

    def chart_payload
      category_colors = %w[#2dbda8 #256897 #1e9a88 #326f91 #62c7ba #4f9fd0 #8f9499 #d8dde2]

      {
        tradeDays: @trade_order_days,
        topProducts: @top_products.map { |name, value| { name:, value: } },
        categories: @products_by_category.each_with_index.map do |(label, value), index|
          { label:, value:, color: category_colors[index % category_colors.length] }
        end,
        catalogStatus: [
          { label: "Ativos", value: @catalog_status[:active], color: "#2dbda8" },
          { label: "Inativos", value: @catalog_status[:inactive], color: "#d8dde2" }
        ]
      }
    end

    def report_cards
      [
        { key: "trade_orders", title: "Pedidos de resgate", count: TradeOrder.count },
        { key: "products", title: "Produtos do catálogo", count: Product.count },
        { key: "announcements", title: "Anúncios", count: Announcement.count },
        { key: "summary", title: "Resumo da plataforma", count: 8 }
      ]
    end

    def report_key(value)
      keys = report_cards.map { |card| card[:key] }
      keys.include?(value) ? value : "summary"
    end

    def report_rows_for(key, from:, to:)
      range = from.beginning_of_day..to.end_of_day

      case key
      when "trade_orders"
        trade_order_rows(range)
      when "products"
        product_rows
      when "announcements"
        announcement_rows(range)
      else
        summary_rows
      end
    end

    def trade_order_rows(range = nil)
      rows = [ [ "Data", "Colaborador", "Produto", "FITC", "Status" ] ]
      scope = TradeOrder.includes(:employee).order(created_at: :desc)
      scope = scope.where(created_at: range) if range
      scope.limit(500).each do |order|
        rows << [
          I18n.l(order.created_at, format: :short),
          order.employee.full_name,
          order.product_name,
          order.product_price_fitc,
          order.status
        ]
      end
      rows
    end

    def product_rows
      rows = [ [ "ID", "Produto", "Categoria", "FITC", "Status" ] ]
      Product.order(:name).limit(500).each do |product|
        rows << [
          product.id,
          product.name,
          product.category,
          product.price_fitc,
          product.active? ? "ativo" : "inativo"
        ]
      end
      rows
    end

    def announcement_rows(range = nil)
      rows = [ [ "ID", "Título", "Status", "Publicado em" ] ]
      scope = Announcement.order(created_at: :desc)
      scope = scope.where(created_at: range) if range
      scope.limit(500).each do |announcement|
        rows << [
          announcement.id,
          announcement.title,
          announcement.status,
          announcement.published_at ? I18n.l(announcement.published_at, format: :short) : ""
        ]
      end
      rows
    end

    def summary_rows
      [
        [ "Indicador", "Valor" ],
        [ "Produtos ativos", Product.active.count ],
        [ "Produtos inativos", Product.where(active: false).count ],
        [ "Pedidos de resgate", TradeOrder.count ],
        [ "Solicitações legadas", TradeRequest.count ],
        [ "Colaboradores cadastrados", Employee.count ],
        [ "Elegíveis ativos", EmployeeEligibility.active.count ],
        [ "FITC em carteiras", FitcWallet.sum(:balance_fitc) ],
        [ "Anúncios publicados", Announcement.published.count ]
      ]
    end

    def csv_document(rows)
      rows.map { |row| row.map { |cell| csv_cell(cell) }.join(",") }.join("\n")
    end

    def csv_cell(value)
      text = value.to_s
      escaped = text.gsub('"', '""')
      escaped.match?(/[",\r\n]/) ? "\"#{escaped}\"" : escaped
    end

    def parse_report_date(value, default:)
      return default if value.blank?

      Date.parse(value.to_s)
    rescue ArgumentError
      default
    end
  end
end
