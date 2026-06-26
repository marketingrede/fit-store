# frozen_string_literal: true

class TradeRequest < ApplicationRecord
  belongs_to :product, optional: true

  validates :name, presence: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :product_name, presence: true

  normalizes :email, with: ->(email) { email.strip.downcase }
end
