# frozen_string_literal: true

class Announcement < ApplicationRecord
  belongs_to :created_by, class_name: "User", optional: true, inverse_of: :announcements

  enum :status, { draft: "draft", published: "published" }, validate: true

  validates :title, presence: true
  validates :slug, presence: true, uniqueness: true,
                   format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }

  scope :published, -> { where(status: :published).order(published_at: :desc) }

  before_validation :sync_published_at, if: :will_save_change_to_status?

  private

  def sync_published_at
    self.published_at = published? ? (published_at || Time.current) : nil
  end
end
