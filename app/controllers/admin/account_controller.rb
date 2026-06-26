# frozen_string_literal: true

module Admin
  class AccountController < BaseController
    def show; end

    def update_password
      unless current_user.authenticate(params[:current_password].to_s)
        flash.now[:alert] = "Senha atual incorreta."
        return render :show, status: :unprocessable_entity
      end

      if params[:password].to_s != params[:password_confirmation].to_s
        flash.now[:alert] = "As senhas não coincidem."
        return render :show, status: :unprocessable_entity
      end

      if current_user.update(password: params[:password])
        redirect_to admin_account_path, notice: "Senha alterada com sucesso."
      else
        flash.now[:alert] = current_user.errors.full_messages.to_sentence
        render :show, status: :unprocessable_entity
      end
    end
  end
end
