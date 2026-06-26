# frozen_string_literal: true

class CreateFitStoreSchema < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :role, null: false, default: "admin"

      t.timestamps
    end
    add_index :users, :email, unique: true

    create_table :products do |t|
      t.string :name, null: false
      t.string :category, null: false
      t.integer :price_fitc, null: false
      t.text :description
      t.string :image_url
      t.string :tag
      t.boolean :active, null: false, default: true

      t.timestamps
    end
    add_index :products, :category
    add_index :products, :active

    create_table :product_attributes do |t|
      t.references :product, null: false, foreign_key: { on_delete: :cascade }
      t.string :name, null: false
      t.string :unit
      t.boolean :required, null: false, default: true
      t.boolean :allow_option_image, null: false, default: false
      t.integer :sort_order, null: false, default: 0

      t.timestamps
    end

    create_table :product_attribute_options do |t|
      t.references :product_attribute, null: false, foreign_key: { on_delete: :cascade }
      t.string :label, null: false
      t.string :image_url
      t.integer :price_fitc_override
      t.integer :sort_order, null: false, default: 0

      t.timestamps
    end

    create_table :catalog_categories do |t|
      t.string :slug, null: false
      t.string :label, null: false
      t.integer :sort_order, null: false, default: 0
      t.boolean :active, null: false, default: true

      t.timestamps
    end
    add_index :catalog_categories, :slug, unique: true

    create_table :catalog_tags do |t|
      t.string :name, null: false
      t.string :color
      t.integer :sort_order, null: false, default: 0
      t.boolean :active, null: false, default: true

      t.timestamps
    end
    add_index :catalog_tags, :name, unique: true

    create_table :variation_presets do |t|
      t.string :name, null: false
      t.string :unit, null: false, default: ""
      t.boolean :required, null: false, default: true
      t.boolean :allow_option_image, null: false, default: false
      t.text :options_json, null: false, default: "[]"
      t.integer :sort_order, null: false, default: 0
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    create_table :announcements do |t|
      t.string :title, null: false
      t.string :slug, null: false
      t.text :content_html
      t.string :image_url
      t.text :crop_data
      t.string :status, null: false, default: "draft"
      t.datetime :published_at
      t.references :created_by, foreign_key: { to_table: :users }

      t.timestamps
    end
    add_index :announcements, :slug, unique: true
    add_index :announcements, :status

    create_table :catalog_cta_cards do |t|
      t.integer :slot, null: false
      t.string :variant, null: false, default: "teal"
      t.string :title
      t.text :body
      t.string :link_url
      t.string :link_label
      t.string :image_url
      t.boolean :active, null: false, default: true

      t.timestamps
    end
    add_index :catalog_cta_cards, :slot, unique: true

    create_table :trade_requests do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.references :product, foreign_key: true
      t.string :product_name, null: false
      t.integer :product_price_fitc
      t.text :product_selection_json

      t.timestamps
    end
    add_index :trade_requests, :created_at

    create_table :employee_eligibilities do |t|
      t.string :employee_id, null: false
      t.string :full_name, null: false
      t.string :email
      t.string :department
      t.string :status, null: false, default: "active"
      t.integer :initial_balance_fitc, null: false, default: 0
      t.text :notes
      t.datetime :imported_at, null: false
      t.datetime :registered_at

      t.timestamps
    end
    add_index :employee_eligibilities, :employee_id, unique: true
    add_index :employee_eligibilities, :status

    create_table :employees do |t|
      t.references :employee_eligibility, null: false, foreign_key: true, index: { unique: true }
      t.string :employee_id, null: false
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :full_name, null: false
      t.boolean :must_change_password, null: false, default: false
      t.datetime :last_login_at

      t.timestamps
    end
    add_index :employees, :employee_id, unique: true
    add_index :employees, :email, unique: true

    create_table :fitc_wallets do |t|
      t.references :employee, null: false, foreign_key: true, index: { unique: true }
      t.integer :balance_fitc, null: false, default: 0

      t.timestamps
    end
    add_check_constraint :fitc_wallets, "balance_fitc >= 0", name: "fitc_wallets_balance_non_negative"

    create_table :fitc_ledger_entries do |t|
      t.references :employee, null: false, foreign_key: true
      t.string :entry_type, null: false
      t.integer :amount_fitc, null: false
      t.integer :balance_after_fitc, null: false
      t.string :reference_type
      t.bigint :reference_id
      t.text :description
      t.references :created_by_user, foreign_key: { to_table: :users }

      t.timestamps
    end
    add_index :fitc_ledger_entries, [ :employee_id, :created_at ]
    add_check_constraint :fitc_ledger_entries, "amount_fitc > 0", name: "fitc_ledger_entries_amount_positive"

    create_table :trade_orders do |t|
      t.references :employee, null: false, foreign_key: true
      t.references :product, foreign_key: true
      t.string :product_name, null: false
      t.integer :product_price_fitc, null: false
      t.text :product_selection_json
      t.string :status, null: false, default: "confirmed"
      t.references :ledger_debit, foreign_key: { to_table: :fitc_ledger_entries }
      t.text :fulfillment_notes

      t.timestamps
    end
    add_index :trade_orders, [ :employee_id, :created_at ]
    add_index :trade_orders, :status
  end
end
