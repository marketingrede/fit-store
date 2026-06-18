CREATE TABLE IF NOT EXISTS catalog_cta_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot INTEGER NOT NULL UNIQUE,
    variant TEXT NOT NULL DEFAULT 'teal',
    title TEXT,
    body TEXT,
    link_url TEXT,
    link_label TEXT,
    image_url TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT
);

INSERT OR IGNORE INTO catalog_cta_cards (slot, variant, title, body, link_url, link_label, image_url, active) VALUES
    (1, 'teal', 'Troque seus Fitcoin', 'Resgate equipamentos e suplementos com seu saldo Movimenta+.', NULL, 'Ver catálogo', NULL, 1),
    (2, 'blue', 'Como funciona', 'Escolha o produto, confirme o resgate e receba o retorno por e-mail.', NULL, 'Saiba mais', NULL, 1);
