# frozen_string_literal: true

module TradeRateLimit
  extend ActiveSupport::Concern

  MAX_ATTEMPTS = 10
  WINDOW_SECONDS = 60

  private

  def enforce_trade_rate_limit!
    key = trade_rate_limit_key
    attempts = Rails.cache.read(key).to_i + 1
    Rails.cache.write(key, attempts, expires_in: WINDOW_SECONDS.seconds)

    return if attempts <= MAX_ATTEMPTS

    render json: {
      ok: false,
      error: "Muitas tentativas de resgate. Aguarde um minuto e tente novamente."
    }, status: :too_many_requests
  end

  def trade_rate_limit_key
    if current_employee
      "trade_rate:employee:#{current_employee.id}"
    else
      "trade_rate:ip:#{request.remote_ip}"
    end
  end
end
