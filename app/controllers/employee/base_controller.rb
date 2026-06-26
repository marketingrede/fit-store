# frozen_string_literal: true

module Employee
  class BaseController < ApplicationController
    include EmployeeAuthenticatable

    layout "employee"

    before_action :require_employee!
  end
end
