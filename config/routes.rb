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

  post "api/colaborador/troca", to: "colaborador/trades#create"

  scope path: "colaborador", as: "colaborador" do
    get "login", to: "colaborador/sessions#new"
    post "login", to: "colaborador/sessions#create"
    post "logout", to: "colaborador/sessions#destroy"

    get "cadastro", to: "colaborador/registrations#new"
    post "registro", to: "colaborador/registrations#create"

    get "/", to: "colaborador/profile#show", as: :root
    get "extrato", to: "colaborador/statements#index"
    get "resgates", to: "colaborador/orders#index"
    get "catalogo", to: "colaborador/catalog#index"
    get "api/catalogo", to: "colaborador/catalog#api"
  end

  namespace :admin do
    get "login", to: "sessions#new"
    post "login", to: "sessions#create"
    post "logout", to: "sessions#destroy"

    root "dashboard#index"

    get "colaboradores", to: "dashboard#employees", as: :employees_hub
    get "relatorios", to: "dashboard#reports", as: :reports
    get "configuracoes", to: "dashboard#catalog_settings", as: :catalog_settings

    resources :products, path: "produtos", except: :show do
      collection do
        post :bulk
      end
      member do
        get :form_data
      end
    end
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
