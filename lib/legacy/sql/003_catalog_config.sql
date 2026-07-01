CREATE TABLE IF NOT EXISTS catalog_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS catalog_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    color TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS variation_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT '',
    required INTEGER NOT NULL DEFAULT 1,
    allow_option_image INTEGER NOT NULL DEFAULT 0,
    options_json TEXT NOT NULL DEFAULT '[]',
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO catalog_categories (slug, label, sort_order) VALUES
    ('alimentos-proteicos', 'Alimentos Proteicos', 1),
    ('equipamentos', 'Equipamentos', 2),
    ('protecao-solar', 'Prote├º├úo Solar', 3),
    ('vitaminas-minerais', 'Vitaminas & Minerais', 4),
    ('acessorios-musculacao', 'Acess├│rios Muscula├º├úo', 5),
    ('medicao', 'Medi├º├úo', 6),
    ('vestuario', 'Vestu├írio', 7),
    ('creatina-energia', 'Creatina & Energia', 8),
    ('proteinas', 'Prote├¡nas', 9),
    ('eletronicos', 'Eletr├┤nicos', 10);

INSERT OR IGNORE INTO catalog_tags (name, color, sort_order) VALUES
    ('Prote├¡na', '#0f766e', 1),
    ('Nutri├º├úo', '#0369a1', 2),
    ('Composi├º├úo', '#7c3aed', 3),
    ('Energia', '#ea580c', 4),
    ('Geral', '#6b7280', 5);

INSERT OR IGNORE INTO variation_presets (name, unit, required, allow_option_image, options_json, sort_order) VALUES
    ('Tamanho', '', 1, 0, '["P","M","G","GG"]', 1),
    ('Volume', 'ml', 1, 0, '["250","500","1000"]', 2),
    ('Peso', 'g', 1, 0, '["300","900","1800"]', 3),
    ('Cor', '', 0, 1, '["Preto","Branco","Azul"]', 4);
