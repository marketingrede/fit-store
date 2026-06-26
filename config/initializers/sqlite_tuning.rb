# frozen_string_literal: true

# Aplica tuning SQLite em toda conexão (dev, test, production, solid_*).
Rails.application.config.after_initialize do
  ActiveSupport.on_load(:active_record) do
    ActiveRecord::ConnectionAdapters::SQLite3Adapter.class_eval do
      alias_method :configure_connection_without_sqlite_tuning, :configure_connection

      def configure_connection
        configure_connection_without_sqlite_tuning
        SqliteTuning.apply!(raw_connection)
      end
    end
  end
end
