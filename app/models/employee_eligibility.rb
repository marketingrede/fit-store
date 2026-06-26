# frozen_string_literal: true

class EmployeeEligibility < ApplicationRecord
  has_one :employee, dependent: :restrict_with_exception

  scope :active, -> { where(status: "active") }

  def mark_registered!
    update!(registered_at: Time.current)
  end
end
