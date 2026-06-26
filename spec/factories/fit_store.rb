# frozen_string_literal: true

FactoryBot.define do
  factory :employee_eligibility do
    sequence(:employee_id) { |n| format("EMP%04d", n) }
    full_name { "João Silva" }
    sequence(:email) { |n| "elegivel#{n}@example.com" }
    department { "Operações" }
    status { "active" }
    initial_balance_fitc { 0 }
    imported_at { Time.current }
  end

  factory :employee do
    transient do
      wallet_balance { 100 }
    end

    employee_eligibility
    employee_id { employee_eligibility.employee_id }
    sequence(:email) { |n| "colaborador#{n}@example.com" }
    password_digest { "hashed_password" }
    full_name { employee_eligibility.full_name }

    after(:create) do |employee, evaluator|
      next if employee.fitc_wallet.present?

      create(:fitc_wallet, employee:, balance_fitc: evaluator.wallet_balance)
    end
  end

  factory :fitc_wallet do
    employee
    balance_fitc { 100 }
  end

  factory :product do
    sequence(:name) { |n| "Produto #{n}" }
    category { "Vestuário" }
    price_fitc { 50 }
    description { "Descrição do produto" }
    active { true }

    trait :with_size_option do
      after(:create) do |product|
        attribute = create(:product_attribute, product:, name: "Tamanho", required: true)
        create(:product_attribute_option, product_attribute: attribute, label: "M")
        create(:product_attribute_option, product_attribute: attribute, label: "G", price_fitc_override: 80)
      end
    end
  end

  factory :product_attribute do
    product
    sequence(:name) { |n| "Atributo #{n}" }
    required { true }
    sort_order { 0 }
  end

  factory :product_attribute_option do
    product_attribute
    sequence(:label) { |n| "Opção #{n}" }
    sort_order { 0 }
  end

  factory :fitc_ledger_entry do
    employee
    entry_type { "credit" }
    amount_fitc { 10 }
    balance_after_fitc { 10 }
    reference_type { "manual_adjustment" }
    description { "Crédito de teste" }
  end

  factory :trade_order do
    employee
    product
    product_name { product.name }
    product_price_fitc { product.price_fitc }
    product_selection_json { "{}" }
    status { "confirmed" }

    trait :with_debit do
      after(:create) do |order|
        ledger = create(
          :fitc_ledger_entry,
          employee: order.employee,
          entry_type: "debit",
          amount_fitc: order.product_price_fitc,
          balance_after_fitc: order.employee.fitc_wallet.balance_fitc,
          reference_type: "trade_order",
          reference_id: order.id,
          description: "Resgate: #{order.product_name}"
        )
        order.update!(ledger_debit: ledger)
      end
    end
  end
end
