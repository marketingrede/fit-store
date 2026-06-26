# frozen_string_literal: true

module Admin
  class CatalogCtaCardsController < BaseController
    before_action :set_card, only: %i[edit update]

    def index
      @cards = CatalogCtaCard.order(:slot)
    end

    def edit; end

    def update
      if @card.update(card_params)
        redirect_to admin_catalog_cta_cards_path, notice: "CTA atualizado."
      else
        render :edit, status: :unprocessable_entity
      end
    end

    private

    def set_card
      @card = CatalogCtaCard.find(params[:id])
    end

    def card_params
      params.require(:catalog_cta_card).permit(
        :variant, :title, :body, :link_url, :link_label, :image_url, :active
      )
    end
  end
end
