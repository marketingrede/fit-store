# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Catalog", type: :request do
  let(:inertia_headers) do
    { "X-Inertia" => "true", "X-Inertia-Version" => ViteRuby.digest }
  end

  describe "GET /" do
    it "renders the catalog Inertia page" do
      create(:product, active: true)

      get root_path, headers: inertia_headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["component"]).to eq("Catalog/Index")
    end

    it "returns catalog props as JSON" do
      product = create(:product, active: true, name: "Camiseta FIT")

      get root_path, params: { q: "Camiseta" }, as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["products"].map { |p| p["name"] }).to include(product.name)
      expect(body).to include("pagination", "filters", "auth")
    end
  end

  describe "GET /produto/:id" do
    it "renders the product Inertia page" do
      product = create(:product, :with_size_option, active: true)

      get product_path(product), headers: inertia_headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["component"]).to eq("Catalog/Show")
    end

    it "returns 404 for inactive product" do
      product = create(:product, active: false)

      get product_path(product)

      expect(response).to have_http_status(:not_found)
    end
  end
end
