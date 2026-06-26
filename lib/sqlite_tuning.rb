# frozen_string_literal: true

# PRAGMAs aplicados em cada conexão SQLite.
# Ver docs/adr/001-sqlite-stack.md para trade-offs (ledger FITC, WAL, backup).
module SqliteTuning
  PRAGMAS = {
    "journal_mode" => "WAL",
    "synchronous" => "NORMAL",
    "busy_timeout" => "10000",
    "foreign_keys" => "ON",
    "cache_size" => "-64000",
    "temp_store" => "MEMORY",
    "mmap_size" => "268435456"
  }.freeze

  module_function

  def apply!(raw_connection)
    PRAGMAS.each do |pragma, value|
      raw_connection.execute("PRAGMA #{pragma} = #{value}")
    end
  end

  def report(raw_connection)
    PRAGMAS.keys.index_with do |pragma|
      raw_connection.execute("PRAGMA #{pragma}").first.values.first
    end
  end
end
