# frozen_string_literal: true

class EmployeeEligibility < ApplicationRecord
  STATUSES = %w[active inactive suspended revoked].freeze

  has_one :employee, dependent: :restrict_with_exception

  scope :active, -> { where(status: "active") }

  validates :employee_id, :full_name, :imported_at, presence: true
  validates :employee_id, uniqueness: { case_sensitive: false }
  validates :status, inclusion: { in: STATUSES }
  validates :initial_balance_fitc, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  def mark_registered!
    update!(registered_at: Time.current)
  end
end
