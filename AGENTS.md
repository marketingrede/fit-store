# AGENTS.md — Fit Store Rails (Movimenta+)

Repositório **100% Rails** na branch `feature/rails-migration`.

## Antes de qualquer mudança

1. `.cursor/rules/00-mandatory-skills.mdc`
2. `.cursor/skills/fit-store-rails/SKILL.md`

## Stack

Rails 8.1 · SQLite (WAL) · Inertia + Svelte 5 · Tailwind · auth por sessão

## Comandos

```bash
bundle install && npm install
bin/rails db:prepare db:seed
bin/rails sqlite:health
bin/dev
```

## SQLite

`lib/sqlite_tuning.rb` · `docs/adr/001-sqlite-stack.md`

## Testes

```bash
bundle exec rspec
```
