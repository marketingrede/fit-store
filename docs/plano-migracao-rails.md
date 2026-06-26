# Plano de migração — Fit Store Rails ✅

> **Status:** migração principal concluída na branch `feature/rails-migration`  
> **Stack:** Rails 8.1 + SQLite tunado + Inertia/Svelte + ERB admin

## Fases concluídas

| Fase | Entregável |
|------|------------|
| F0 | Scaffold, SQLite tuning, CI, regras Cursor |
| F1 | Migration consolidada, 15 models, seeds |
| F2 | `Trades::ProcessRedemption`, `ReverseOrder`, `SelectionValidator`, specs |
| F3 | Admin ERB (produtos, anúncios, colaboradores, configurações) |
| F4 | Catálogo público + API + páginas Svelte (Inertia) |
| F5 | Colaborador: login, cadastro, extrato, resgates, catálogo, troca |
| F6 | `legacy:import_sqlite`, promote para raiz |
| F7 | Estorno em pedidos, ajuste manual de saldo |

## Comandos

```bash
bundle install && npm install
bin/rails db:prepare db:seed
bin/rails sqlite:health
bin/dev
bundle exec rspec spec/services
bin/rails legacy:import_sqlite   # opcional
```

## ADR

- [001-sqlite-stack.md](adr/001-sqlite-stack.md)

## Próximos passos opcionais

- Pixel-perfect UI (port completo do CSS legado)
- Playwright E2E no Rails
- Avo em substituição gradual ao admin ERB
- Turso sync se necessário
