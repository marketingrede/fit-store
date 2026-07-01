# frozen_string_literal: true

namespace :legacy do
  desc "Monta storage/legacy_app.db a partir do schema e seed do projeto PHP"
  task build_sqlite: :environment do
    require Rails.root.join("db/seeds/legacy_products.rb")
    path = Legacy::SqliteBuilder.build!
    puts "Banco legado gerado em #{path}"
  end

  desc "Importa catálogo (produtos, categorias, variações, CTAs) do SQLite legado"
  task import_catalog: :environment do
    require Rails.root.join("db/seeds/legacy_products.rb")
    replace = ENV["REPLACE"] == "1"
    counts = Legacy::CatalogImporter.call(replace_products: replace)
    counts.each { |key, value| puts "  #{key}: #{value}" }
    puts "Importação de catálogo concluída."
  end

  desc "Importa dados do SQLite legado (PHP) para o banco Rails atual"
  task import_sqlite: :environment do
    require Rails.root.join("db/seeds/legacy_products.rb")

    source = ENV["LEGACY_DB_PATH"].presence
    source ||= Rails.root.join("lib/legacy/data/legacy_app.db").to_s if File.exist?(Rails.root.join("lib/legacy/data/legacy_app.db"))
    source ||= Rails.root.join("storage/legacy_app.db").to_s if File.exist?(Rails.root.join("storage/legacy_app.db")) && File.size(Rails.root.join("storage/legacy_app.db")).positive?
    source ||= Rails.root.join("data/app.db").to_s if File.exist?(Rails.root.join("data/app.db"))

    unless source && File.exist?(source) && File.size(source).positive?
      source = Legacy::SqliteBuilder.build!
      puts "Banco legado ausente; gerado em #{source}"
    end

    require "sqlite3"
    legacy = SQLite3::Database.new(source)
    legacy.results_as_hash = true
    puts "Importando de #{source}..."

    rows = legacy.execute("SELECT * FROM users")
    rows.each do |row|
      User.find_or_create_by!(email: row["email"]) do |user|
        user.password_digest = row["password_hash"]
        user.role = row["role"] || "admin"
      end
    end
    puts "  users: #{rows.size}"

    counts = Legacy::CatalogImporter.call(source: source, replace_products: ENV["REPLACE"] == "1")
    counts.each { |key, value| puts "  #{key}: #{value}" }

    puts "Concluído."
  rescue SQLite3::Exception => e
    abort "Erro SQLite: #{e.message}"
  end
end
