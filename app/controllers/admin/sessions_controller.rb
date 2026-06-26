# frozen_string_literal: true

module Admin
  class SessionsController < ApplicationController
    include AdminAuthenticatable

    layout "admin"

    before_action :redirect_if_admin_signed_in!, only: %i[new create]

    def new
      @error = flash[:alert]
    end

    def create
      if admin_login_locked?
        flash.now[:alert] = "Muitas tentativas. Aguarde 15 minutos e tente novamente."
        return render :new, status: :too_many_requests
      end

      user = User.find_by(email: params[:email].to_s.strip.downcase)

      if user&.authenticate(params[:password].to_s)
        clear_admin_login_lockout!
        sign_in_admin!(user)
        redirect_to admin_root_path
      else
        register_admin_failed_attempt!
        flash.now[:alert] = "E-mail ou senha incorretos."
        render :new, status: :unauthorized
      end
    end

    def destroy
      sign_out_admin!
      redirect_to admin_login_path
    end
  end
end
