# frozen_string_literal: true

module Admin
  class BaseController < ApplicationController
    include AdminAuthenticatable
    include Pagy::Method

    layout "admin"

    before_action :require_admin!
  end
end
