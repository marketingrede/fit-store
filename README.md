# Fit Store — Movimenta+

Loja virtual com painel administrativo em **Rails 8 + SQLite + Inertia/Svelte**.

## Stack

- Rails 8.1 + SQLite 3 (WAL, `lib/sqlite_tuning.rb`)
- Tailwind CSS
- Inertia.js + Svelte 5 (loja)
- Admin ERB + Hotwire

## Setup

### Docker (recomendado no Windows)

```bash
docker compose up --build
# App: http://localhost:3030
```

No Windows, `rails s` local exige WSL2 ou Linux — gems nativas (Puma, etc.) não instalam sem `make`. Use Docker.

### Local (Linux / macOS / WSL2)

```bash
bundle install
npm install
bin/rails db:prepare db:seed
bin/rails sqlite:health
bin/dev
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste:

- `ADMIN_PASSWORD` — senha dos admins no seed
- `SESSION_SECRET` — chave de sessão (produção)

## Credenciais admin (seed)

- `epilian.silva@redemontagens.com.br`
- `raillen.santos@redemontagens.com.br`

Senha: valor de `ADMIN_PASSWORD` (padrão `altere-esta-senha`).

## Rotas principais

| Rota | Descrição |
|------|-----------|
| `/` | Catálogo |
| `/produto/:id` | Produto |
| `/colaborador/login` | Login colaborador |
| `/colaborador/catalogo` | Resgates |
| `/admin` | Dashboard |
| `/admin/produtos` | CRUD produtos |
| `/admin/colaboradores` | Gestão FITC |
| `/health` | Health check |

## SQLite

```bash
bin/rails sqlite:health
bin/rails sqlite:wal_checkpoint   # antes de backup
bin/rails legacy:import_sqlite    # importar storage/legacy_app.db
```

Ver [docs/adr/001-sqlite-stack.md](docs/adr/001-sqlite-stack.md).

## Testes

```bash
bundle exec rspec
bin/rubocop
bin/brakeman
```

## Documentação

- [docs/plano-migracao-rails.md](docs/plano-migracao-rails.md)
- [AGENTS.md](AGENTS.md) — skills obrigatórias para agentes IA
