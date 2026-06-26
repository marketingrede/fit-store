# ADR 001 — SQLite como banco único com tuning

**Status:** aceito  
**Data:** 2026-06-25  
**Contexto:** migração PHP Slim → Rails 8 (`fit_store_rails/`)

## Decisão

Manter **SQLite 3** em desenvolvimento, teste e produção, com PRAGMAs centralizados e rotinas de manutenção (`rake sqlite:*`).

Não adotar PostgreSQL nesta migração.

## Motivação

- Paridade com o legado (`data/app.db`, Turso/LibSQL em produção atual).
- Deploy simples no Render (volume persistente em `storage/`).
- Escala atual do Fit Store (colaboradores Rede Montagens) cabe em SQLite com WAL.
- Um único arquivo facilita backup e restore.

## PRAGMAs aplicados (`SqliteTuning`)

| PRAGMA | Valor | Motivo |
|--------|-------|--------|
| `journal_mode` | WAL | Leituras concorrentes com escrita |
| `synchronous` | NORMAL | Equilíbrio durabilidade/performance com WAL |
| `busy_timeout` | 10000 ms | Espera em lock de escrita (resgates simultâneos) |
| `foreign_keys` | ON | Integridade referencial |
| `cache_size` | -64000 (~64 MB) | Cache de páginas |
| `temp_store` | MEMORY | Temp tables em RAM |
| `mmap_size` | 256 MB | Leitura mapeada quando suportado |

## Transações FITC

- `database.yml`: `default_transaction_mode: immediate` — reduz race em débito de saldo.
- Services usam `ActiveRecord::Base.transaction` + `fitc_wallet.lock!`.
- SQLite serializa escritas: aceitável; monitorar se latência de resgate crescer.

## Backup (produção)

1. `bin/rails sqlite:wal_checkpoint`
2. Copiar `storage/production.sqlite3` (e opcionalmente `-wal`/`-shm` se checkpoint falhar)
3. Testar restore em staging com `bin/rails sqlite:health`

Agendar backup diário do volume `storage/`.

## Manutenção

- Semanal (ou pós-importação massiva): `bin/rails sqlite:optimize`
- CI: `sqlite:health` após migrations

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Corrupção por cópia com WAL ativo | Checkpoint antes do backup |
| Muitas escritas simultâneas | `busy_timeout`; fila Sidekiq para imports |
| Crescimento do arquivo | `VACUUM` periódico; arquivar `trade_requests` legado |

## Alternativas rejeitadas

- **PostgreSQL:** mais ops; adiado até ADR futuro se escala exigir.
- **Turso remoto:** possível fase 2; Rails usará arquivo local + volume no Render primeiro.

## Referências no código

- `fit_store_rails/lib/sqlite_tuning.rb`
- `fit_store_rails/config/initializers/sqlite_tuning.rb`
- `fit_store_rails/lib/tasks/sqlite.rake`
