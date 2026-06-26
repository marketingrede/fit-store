# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_06_25_100000) do
  create_table "announcements", force: :cascade do |t|
    t.text "content_html"
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.text "crop_data"
    t.string "image_url"
    t.datetime "published_at"
    t.string "slug", null: false
    t.string "status", default: "draft", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_announcements_on_created_by_id"
    t.index ["slug"], name: "index_announcements_on_slug", unique: true
    t.index ["status"], name: "index_announcements_on_status"
  end

  create_table "catalog_categories", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.string "label", null: false
    t.string "slug", null: false
    t.integer "sort_order", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_catalog_categories_on_slug", unique: true
  end

  create_table "catalog_cta_cards", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.text "body"
    t.datetime "created_at", null: false
    t.string "image_url"
    t.string "link_label"
    t.string "link_url"
    t.integer "slot", null: false
    t.string "title"
    t.datetime "updated_at", null: false
    t.string "variant", default: "teal", null: false
    t.index ["slot"], name: "index_catalog_cta_cards_on_slot", unique: true
  end

  create_table "catalog_tags", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "color"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.integer "sort_order", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_catalog_tags_on_name", unique: true
  end

  create_table "employee_eligibilities", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "department"
    t.string "email"
    t.string "employee_id", null: false
    t.string "full_name", null: false
    t.datetime "imported_at", null: false
    t.integer "initial_balance_fitc", default: 0, null: false
    t.text "notes"
    t.datetime "registered_at"
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["employee_id"], name: "index_employee_eligibilities_on_employee_id", unique: true
    t.index ["status"], name: "index_employee_eligibilities_on_status"
  end

  create_table "employees", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.integer "employee_eligibility_id", null: false
    t.string "employee_id", null: false
    t.string "full_name", null: false
    t.datetime "last_login_at"
    t.boolean "must_change_password", default: false, null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_employees_on_email", unique: true
    t.index ["employee_eligibility_id"], name: "index_employees_on_employee_eligibility_id", unique: true
    t.index ["employee_id"], name: "index_employees_on_employee_id", unique: true
  end

  create_table "fitc_ledger_entries", force: :cascade do |t|
    t.integer "amount_fitc", null: false
    t.integer "balance_after_fitc", null: false
    t.datetime "created_at", null: false
    t.integer "created_by_user_id"
    t.text "description"
    t.integer "employee_id", null: false
    t.string "entry_type", null: false
    t.bigint "reference_id"
    t.string "reference_type"
    t.datetime "updated_at", null: false
    t.index ["created_by_user_id"], name: "index_fitc_ledger_entries_on_created_by_user_id"
    t.index ["employee_id", "created_at"], name: "index_fitc_ledger_entries_on_employee_id_and_created_at"
    t.index ["employee_id"], name: "index_fitc_ledger_entries_on_employee_id"
    t.check_constraint "amount_fitc > 0", name: "fitc_ledger_entries_amount_positive"
  end

  create_table "fitc_wallets", force: :cascade do |t|
    t.integer "balance_fitc", default: 0, null: false
    t.datetime "created_at", null: false
    t.integer "employee_id", null: false
    t.datetime "updated_at", null: false
    t.index ["employee_id"], name: "index_fitc_wallets_on_employee_id", unique: true
    t.check_constraint "balance_fitc >= 0", name: "fitc_wallets_balance_non_negative"
  end

  create_table "product_attribute_options", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "image_url"
    t.string "label", null: false
    t.integer "price_fitc_override"
    t.integer "product_attribute_id", null: false
    t.integer "sort_order", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["product_attribute_id"], name: "index_product_attribute_options_on_product_attribute_id"
  end

  create_table "product_attributes", force: :cascade do |t|
    t.boolean "allow_option_image", default: false, null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.integer "product_id", null: false
    t.boolean "required", default: true, null: false
    t.integer "sort_order", default: 0, null: false
    t.string "unit"
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_product_attributes_on_product_id"
  end

  create_table "products", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "category", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "image_url"
    t.string "name", null: false
    t.integer "price_fitc", null: false
    t.string "tag"
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_products_on_active"
    t.index ["category"], name: "index_products_on_category"
  end

  create_table "trade_orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "employee_id", null: false
    t.text "fulfillment_notes"
    t.integer "ledger_debit_id"
    t.integer "product_id"
    t.string "product_name", null: false
    t.integer "product_price_fitc", null: false
    t.text "product_selection_json"
    t.string "status", default: "confirmed", null: false
    t.datetime "updated_at", null: false
    t.index ["employee_id", "created_at"], name: "index_trade_orders_on_employee_id_and_created_at"
    t.index ["employee_id"], name: "index_trade_orders_on_employee_id"
    t.index ["ledger_debit_id"], name: "index_trade_orders_on_ledger_debit_id"
    t.index ["product_id"], name: "index_trade_orders_on_product_id"
    t.index ["status"], name: "index_trade_orders_on_status"
  end

  create_table "trade_requests", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.integer "product_id"
    t.string "product_name", null: false
    t.integer "product_price_fitc"
    t.text "product_selection_json"
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_trade_requests_on_created_at"
    t.index ["product_id"], name: "index_trade_requests_on_product_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "role", default: "admin", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  create_table "variation_presets", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.boolean "allow_option_image", default: false, null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.text "options_json", default: "[]", null: false
    t.boolean "required", default: true, null: false
    t.integer "sort_order", default: 0, null: false
    t.string "unit", default: "", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "announcements", "users", column: "created_by_id"
  add_foreign_key "employees", "employee_eligibilities"
  add_foreign_key "fitc_ledger_entries", "employees"
  add_foreign_key "fitc_ledger_entries", "users", column: "created_by_user_id"
  add_foreign_key "fitc_wallets", "employees"
  add_foreign_key "product_attribute_options", "product_attributes", on_delete: :cascade
  add_foreign_key "product_attributes", "products", on_delete: :cascade
  add_foreign_key "trade_orders", "employees"
  add_foreign_key "trade_orders", "fitc_ledger_entries", column: "ledger_debit_id"
  add_foreign_key "trade_orders", "products"
  add_foreign_key "trade_requests", "products"
end
