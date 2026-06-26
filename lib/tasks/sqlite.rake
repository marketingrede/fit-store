# frozen_string_literal: true

namespace :sqlite do
  module Helpers
    module_function

    def conn_db_path(conn)
      row = conn.execute("PRAGMA database_list").find { |r| r["name"] == "main" }
      row&.dig("file") || "unknown"
    end

    def integrity_ok?(conn)
      conn.execute("PRAGMA integrity_check").first&.values&.first == "ok"
    end
  end

  desc "Exibe PRAGMAs ativos e integridade do banco primary"
  task health: :environment do
    conn = ActiveRecord::Base.connection
    puts "Database: #{Helpers.conn_db_path(conn)}"
    puts "\n--- PRAGMAs ---"
    SqliteTuning.report(conn.raw_connection).each { |k, v| puts "  #{k}: #{v}" }
    puts "\n--- integrity_check ---"
    ok = Helpers.integrity_ok?(conn)
    puts ok ? "  ok\n\nOK" : "  FALHA\n\nFALHA — investigar antes de deploy"
  end

  desc "VACUUM + ANALYZE no banco primary (janela de manutenção)"
  task optimize: :environment do
    conn = ActiveRecord::Base.connection
    path = Helpers.conn_db_path(conn)
    size_before = File.size(path)
    conn.execute("VACUUM")
    conn.execute("ANALYZE")
    size_after = File.size(path)
    puts "Otimizado: #{path}"
    puts "Tamanho: #{size_before} → #{size_after} bytes"
  end

  desc "Checkpoint WAL (útil antes de backup com app rodando)"
  task wal_checkpoint: :environment do
    ActiveRecord::Base.connection.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    puts "WAL checkpoint concluído."
  end
end
