# frozen_string_literal: true

namespace :legacy do
  desc "Importa dados do SQLite legado (PHP) para o banco Rails atual"
  task import_sqlite: :environment do
    source = ENV["LEGACY_DB_PATH"].presence
    source ||= Rails.root.join("storage/legacy_app.db").to_s if Rails.root.join("storage/legacy_app.db").exist?
    source ||= Rails.root.join("data/app.db").to_s if Rails.root.join("data/app.db").exist?
    abort "Banco legado não encontrado." unless source && File.exist?(source)

    require "sqlite3"
    legacy = SQLite3::Database.new(source)
    legacy.results_as_hash = true
    puts "Importando de #{source}..."

    rows = legacy.execute("SELECT * FROM users")
    rows.each do |row|
      User.find_or_create_by!(email: row["email"]) do |u|
        u.password_digest = row["password_hash"]
        u.role = row["role"] || "admin"
      end
    end
    puts "  users: #{rows.size}"

    rows = legacy.execute("SELECT * FROM products")
    rows.each do |row|
      Product.find_or_create_by!(id: row["id"]) do |p|
        p.name = row["name"]
        p.category = row["category"]
        p.price_fitc = row["price_fitc"]
        p.description = row["description"]
        p.image_url = row["image_url"]
        p.tag = row["tag"]
        p.active = row["active"].to_i == 1
      end
    end
    puts "  products: #{rows.size}"

    puts "Concluído. Users=#{User.count} Products=#{Product.count}"
  rescue SQLite3::Exception => e
    abort "Erro SQLite: #{e.message}"
  end
end
