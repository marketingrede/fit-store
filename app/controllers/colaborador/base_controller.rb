# frozen_string_literal: true

module Colaborador
  class BaseController < ApplicationController
    include EmployeeAuthenticatable

    layout "application"

    before_action :require_employee!
  end
end
