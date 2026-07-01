# frozen_string_literal: true

require "sqlite3"

module Legacy
  class SqliteBuilder
    TARGET = Rails.root.join("lib/legacy/data/legacy_app.db").freeze
    SQL_DIR = Rails.root.join("lib/legacy/sql").freeze

    def self.build!(target: TARGET)
      new(target: target).build!
    end

    def initialize(target: TARGET)
      @target = Pathname(target)
    end

    def build!
      FileUtils.mkdir_p(@target.dirname)
      File.delete(@target) if @target.exist?

      db = SQLite3::Database.new(@target.to_s)
      db.execute("PRAGMA foreign_keys = ON")

      sql_files.each { |file| execute_sql_file(db, file) }
      seed_products(db)

      db.close
      @target.to_s
    end

    private

    def sql_files
      [
        SQL_DIR.join("schema.sql"),
        SQL_DIR.join("001_product_variations.sql"),
        SQL_DIR.join("003_catalog_config.sql"),
        SQL_DIR.join("004_catalog_cta_cards.sql")
      ].select(&:exist?)
    end

    def execute_sql_file(db, path)
      sql = path.read.sub(/\A\uFEFF/, "")
      sql.split(/;\s*\n/m).each do |statement|
        trimmed = statement.strip
        next if trimmed.blank?

        db.execute(trimmed)
      end
    end

    def seed_products(db)
      load Rails.root.join("db/seeds/legacy_products.rb")

      stmt = db.prepare(
        "INSERT INTO products (id, name, category, price_fitc, description, image_url, tag, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
      )

      LEGACY_PRODUCTS.each do |row|
        stmt.execute(
          row[:id],
          row[:name],
          row[:category],
          row[:price_fitc],
          row[:description],
          row[:image_url],
          row[:tag]
        )
      end
    end
  end
end
