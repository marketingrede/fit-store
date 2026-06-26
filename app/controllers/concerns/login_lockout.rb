# frozen_string_literal: true

module LoginLockout
  extend ActiveSupport::Concern

  MAX_ATTEMPTS = 5
  LOCKOUT_SECONDS = 900

  private

  def login_locked?(attempts_key:, locked_until_key:)
    session[locked_until_key].to_i > Time.current.to_i
  end

  def register_failed_login_attempt!(attempts_key:, locked_until_key:)
    attempts = session[attempts_key].to_i + 1
    session[attempts_key] = attempts

    return unless attempts >= MAX_ATTEMPTS

    session[locked_until_key] = Time.current.to_i + LOCKOUT_SECONDS
    session[attempts_key] = 0
  end

  def clear_login_lockout!(attempts_key:, locked_until_key:)
    session.delete(attempts_key)
    session.delete(locked_until_key)
  end
end
