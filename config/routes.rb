# frozen_string_literal: true

Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check
  get "health", to: "health#show"

  root "catalog#index"

  get "produto/:id", to: "products#show", as: :product
  get "index.html", to: redirect("/")
  get "produto.html", to: redirect { |params, _| params[:id].present? ? "/produto/#{params[:id]}" : "/" }
  get "partials/home", to: "catalog#index"

  namespace :api do
    get "announcements", to: "announcements#index"
    get "catalog/products", to: "catalog_products#index"
  end

  post "api/colaborador/troca", to: "employee/trades#create"

  scope path: "colaborador", as: "colaborador" do
    get "login", to: "employee/sessions#new"
    post "login", to: "employee/sessions#create"
    post "logout", to: "employee/sessions#destroy"

    get "cadastro", to: "employee/registrations#new"
    post "registro", to: "employee/registrations#create"

    get "/", to: "employee/profile#show", as: :root
    get "extrato", to: "employee/statements#index"
    get "resgates", to: "employee/orders#index"
    get "catalogo", to: "employee/catalog#index"
    get "api/catalogo", to: "employee/catalog#api"
  end

  namespace :admin do
    get "login", to: "sessions#new"
    post "login", to: "sessions#create"
    post "logout", to: "sessions#destroy"

    root "dashboard#index"

    get "colaboradores", to: "dashboard#employees", as: :employees_hub

    resources :products, path: "produtos", except: :show
    resources :announcements, path: "anuncios", except: :show

    get "trocas", to: "trade_requests#index", as: :trade_requests

    resources :trade_orders, path: "colaboradores/pedidos", only: %i[index update], as: :trade_orders

    resources :employee_eligibilities, path: "colaboradores/elegiveis", except: :show
    resources :employees, path: "colaboradores/contas", only: %i[index show destroy]

    get "colaboradores/saldos", to: "fitc_wallets#index", as: :fitc_wallets
    post "colaboradores/saldos/ajustar", to: "fitc_wallets#adjust", as: :adjust_fitc_wallet

    resources :catalog_categories, path: "configuracoes/categorias", except: :show
    resources :catalog_tags, path: "configuracoes/tags", except: :show
    resources :variation_presets, path: "configuracoes/variacoes", except: :show
    resources :catalog_cta_cards, path: "configuracoes/ctas", only: %i[index edit update]

    get "conta", to: "account#show", as: :account
    patch "conta/senha", to: "account#update_password", as: :update_password
  end
end
