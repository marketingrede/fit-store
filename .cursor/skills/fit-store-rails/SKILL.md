---
name: fit-store-rails
description: >-
  Fit Store Movimenta+ em Rails 8 + Inertia + Svelte + SQLite tunado.
  OBRIGATÓRIO em qualquer tarefa neste repositório.
---

# Fit Store Rails

Monólito Rails na raiz do repositório (branch `feature/rails-migration`).

## Stack

Rails 8.1 · SQLite (WAL) · Inertia + Svelte 5 · Tailwind · session auth

## Estrutura

- `app/models/` — domínio FITC
- `app/services/` — `Trades::ProcessRedemption`, `Trades::ReverseOrder`, etc.
- `app/controllers/` — loja, `employee/`, `admin/`, `api/`
- `app/frontend/` — páginas Svelte Inertia
- `lib/sqlite_tuning.rb` — PRAGMAs

## Comandos

```bash
bundle install && npm install
bin/rails db:prepare db:seed
bin/rails sqlite:health
bin/dev
bundle exec rspec
```

## Import legado

```bash
bin/rails legacy:import_sqlite   # storage/legacy_app.db ou LEGACY_DB_PATH
```

## Skills obrigatórias

Ver `.cursor/rules/00-mandatory-skills.mdc`
