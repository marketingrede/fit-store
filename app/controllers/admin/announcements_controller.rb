# frozen_string_literal: true

module Admin
  class AnnouncementsController < BaseController
    before_action :set_announcement, only: %i[edit update destroy]

    def index
      @announcements = Announcement.order(created_at: :desc)
    end

    def new
      @announcement = Announcement.new(status: :draft)
    end

    def create
      @announcement = Announcement.new(announcement_params)
      @announcement.created_by = current_user

      if @announcement.save
        redirect_to admin_announcements_path, notice: "Anúncio criado."
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit; end

    def update
      if @announcement.update(announcement_params)
        redirect_to admin_announcements_path, notice: "Anúncio atualizado."
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @announcement.destroy!
      redirect_to admin_announcements_path, notice: "Anúncio excluído."
    end

    private

    def set_announcement
      @announcement = Announcement.find(params[:id])
    end

    def announcement_params
      params.require(:announcement).permit(:title, :slug, :content_html, :image_url, :status, :published_at)
    end
  end
end
