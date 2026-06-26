# frozen_string_literal: true

module Api
  class AnnouncementsController < ApplicationController
    def index
      announcements = Announcement.published.limit(20)

      render json: {
        ok: true,
        announcements: announcements.map { |a| serialize_announcement(a) }
      }
    end

    private

    def serialize_announcement(announcement)
      {
        id: announcement.id,
        title: announcement.title,
        slug: announcement.slug,
        content_html: announcement.content_html,
        image_url: announcement.image_url,
        published_at: announcement.published_at
      }
    end
  end
end
