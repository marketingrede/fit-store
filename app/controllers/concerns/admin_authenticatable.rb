# frozen_string_literal: true

module AdminAuthenticatable
  extend ActiveSupport::Concern
  include LoginLockout

  included do
    helper_method :current_user if respond_to?(:helper_method)
  end

  private

  def require_admin!
    return if current_user

    redirect_to admin_login_path, alert: "Faça login para continuar."
  end

  def redirect_if_admin_signed_in!
    redirect_to admin_root_path if current_user
  end

  def admin_login_locked?
    login_locked?(attempts_key: :login_attempts, locked_until_key: :login_locked_until)
  end

  def register_admin_failed_attempt!
    register_failed_login_attempt!(attempts_key: :login_attempts, locked_until_key: :login_locked_until)
  end

  def clear_admin_login_lockout!
    clear_login_lockout!(attempts_key: :login_attempts, locked_until_key: :login_locked_until)
  end

  def sign_in_admin!(user)
    reset_session
    session[:user_id] = user.id
    session[:user_email] = user.email
  end

  def sign_out_admin!
    reset_session
  end
end
