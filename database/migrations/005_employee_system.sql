-- Employee eligibility (whitelist for registration)
CREATE TABLE IF NOT EXISTS employee_eligibility (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    department TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    initial_balance_fitc INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    imported_at TEXT NOT NULL DEFAULT (datetime('now')),
    registered_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_employee_eligibility_status ON employee_eligibility(status);

-- Employee accounts
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eligibility_id INTEGER NOT NULL UNIQUE,
    employee_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT,
    FOREIGN KEY (eligibility_id) REFERENCES employee_eligibility(id)
);

-- Fitcoin wallets (materialized balance)
CREATE TABLE IF NOT EXISTS fitc_wallets (
    employee_id INTEGER PRIMARY KEY,
    balance_fitc INTEGER NOT NULL DEFAULT 0 CHECK (balance_fitc >= 0),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Fitcoin ledger (immutable transaction log)
CREATE TABLE IF NOT EXISTS fitc_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount_fitc INTEGER NOT NULL CHECK (amount_fitc > 0),
    balance_after_fitc INTEGER NOT NULL,
    reference_type TEXT,
    reference_id INTEGER,
    description TEXT,
    created_by_user_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_fitc_ledger_employee ON fitc_ledger(employee_id, created_at DESC);

-- Trade orders (confirmed trades with debit)
CREATE TABLE IF NOT EXISTS trade_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    product_price_fitc INTEGER NOT NULL,
    product_selection_json TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    ledger_debit_id INTEGER,
    fulfillment_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (ledger_debit_id) REFERENCES fitc_ledger(id)
);

CREATE INDEX IF NOT EXISTS idx_trade_orders_employee ON trade_orders(employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_orders_status ON trade_orders(status);