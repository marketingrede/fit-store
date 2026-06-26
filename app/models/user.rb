# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password

  has_many :announcements, foreign_key: :created_by_id, dependent: :nullify, inverse_of: :created_by
  has_many :fitc_ledger_entries, foreign_key: :created_by_user_id, dependent: :nullify, inverse_of: :created_by_user

  enum :role, { admin: "admin", operator: "operator" }, validate: true

  validates :email, presence: true, uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, if: -> { password.present? }

  normalizes :email, with: ->(email) { email.strip.downcase }
end
