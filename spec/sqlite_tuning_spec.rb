# frozen_string_literal: true

require "rails_helper"

RSpec.describe SqliteTuning do
  self.use_transactional_tests = false

  describe ".apply!" do
    it "configura WAL e foreign_keys na conexão" do
      conn = ActiveRecord::Base.connection.raw_connection
      described_class.apply!(conn)
      report = described_class.report(conn)

      expect(report["journal_mode"]).to eq("wal")
      expect(report["foreign_keys"]).to eq(1)
      expect(report["busy_timeout"]).to eq(10_000)
    end
  end
end
