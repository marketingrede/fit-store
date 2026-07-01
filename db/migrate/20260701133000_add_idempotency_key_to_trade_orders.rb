# frozen_string_literal: true

class AddIdempotencyKeyToTradeOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :trade_orders, :idempotency_key, :string
    add_index :trade_orders,
              %i[employee_id idempotency_key],
              unique: true,
              where: "idempotency_key IS NOT NULL"
  end
end
