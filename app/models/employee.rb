# frozen_string_literal: true

class Employee < ApplicationRecord
  has_secure_password

  belongs_to :employee_eligibility
  has_one :fitc_wallet, dependent: :destroy
  has_many :fitc_ledger_entries, dependent: :restrict_with_exception
  has_many :trade_orders, dependent: :restrict_with_exception

  validates :employee_id, :email, :full_name, presence: true
  validates :employee_id, :email, uniqueness: { case_sensitive: false }
  validates :password, length: { minimum: 8 }, if: -> { password.present? }

  normalizes :email, with: ->(email) { email.strip.downcase }
end
