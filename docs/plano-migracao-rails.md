# Plano de migracao e implementacao - Fit Store Rails

> **Branch:** `feature/rails-migration`
> **Atualizado:** 2026-07-01
> **Stack alvo:** Rails 8.1, SQLite WAL, Inertia, Svelte 5, Tailwind, sessao Rails

## Resumo

A migracao Rails ja passou da fase de esqueleto. O projeto atual tem catalogo
publico em Inertia/Svelte, area do colaborador em Inertia/Svelte, admin ERB,
dominio FITC com carteira, ledger, pedido, debito transacional e estorno.

O estado atual e funcional para desenvolvimento, mas ainda nao deve ser tratado
como pronto para producao sem fechar as lacunas listadas abaixo.

| Camada | Estado atual |
| --- | --- |
| Banco e dominio FITC | Implementado, com SQLite WAL e transacoes explicitas |
| Catalogo publico | Inertia/Svelte em `/` e `/produto/:id` |
| Area colaborador | Inertia/Svelte em login, cadastro, perfil, extrato, resgates e catalogo |
| Troca FITC | Debita saldo imediatamente, cria `TradeOrder` confirmado e aceita chave de idempotencia |
| Admin | ERB com JS via Vite; cobre produtos, anuncios, saldos, pedidos, relatorios e configuracoes |
| Legacy import | Mantido em `bin/rails legacy:import_sqlite` |
| Testes | RSpec cobre services FITC e request specs principais |
| CI | Usa Brakeman, bundler-audit, npm audit, RuboCop, Vite build e RSpec |

## Arquitetura atual

```text
Browser
  |
  |-- Loja publica + colaborador
  |     Inertia + Svelte + Vite
  |     Layout: app/views/layouts/application.html.erb
  |
  |-- Admin
  |     ERB + helpers Rails + JS Vite
  |     Layout: app/views/layouts/admin.html.erb
  |
  |-- APIs JSON
        /api/announcements
        /api/catalog/products
        /api/colaborador/troca
```

## Rotas principais

| Rota | Papel |
| --- | --- |
| `/` | Catalogo publico |
| `/produto/:id` | Detalhe do produto |
| `/colaborador/login` | Login colaborador |
| `/colaborador/cadastro` | Cadastro por matricula elegivel |
| `/colaborador` | Perfil do colaborador |
| `/colaborador/extrato` | Ledger FITC do colaborador |
| `/colaborador/resgates` | Pedidos do colaborador |
| `/colaborador/catalogo` | Catalogo logado para resgate |
| `/api/colaborador/troca` | Debito FITC + pedido confirmado |
| `/admin` | Dashboard administrativo |
| `/admin/produtos` | CRUD de produtos |
| `/admin/colaboradores/elegiveis` | Matriculas autorizadas |
| `/admin/colaboradores/saldos` | Ajuste manual de saldo |
| `/admin/colaboradores/pedidos` | Pedidos e estornos |

## FITC

O fluxo de resgate e imediato:

1. Colaborador precisa estar logado.
2. Produto precisa estar ativo.
3. Variacoes sao validadas no servidor.
4. Preco final e recalculado no servidor.
5. Reenvio com a mesma `Idempotency-Key` retorna o pedido ja criado.
6. `Trades::ProcessRedemption` abre transacao.
7. Carteira e bloqueada com `fitc_wallet.lock!`.
8. Saldo e debitado.
9. Ledger recebe entrada `debit`.
10. Pedido e criado como `confirmed`.

Estorno administrativo usa `Trades::ReverseOrder`, cria ledger `reversal` e
devolve saldo sem apagar historico.

## SQLite

A decisao de banco esta em `docs/adr/001-sqlite-stack.md`.

Pontos importantes:

- `journal_mode = WAL`
- `busy_timeout = 10000`
- `foreign_keys = ON`
- `default_transaction_mode = immediate`
- services FITC usam transacao explicita e lock de carteira

Comandos:

```bash
bin/rails sqlite:health
bin/rails sqlite:wal_checkpoint
bin/rails sqlite:optimize
```

## Desenvolvimento

Setup:

```bash
bundle install
npm install
bin/rails db:prepare db:seed
bin/rails sqlite:health
bin/dev
```

No Windows, o caminho recomendado continua sendo Docker ou WSL2 quando gems
nativas criarem atrito. O `bin/dev` sobe:

- Rails em Puma
- Vite para Inertia/Svelte/admin JS
- Tailwind watcher para assets Rails do admin

## Validacao local

Antes de considerar uma fatia pronta:

```bash
bundle exec rspec
bundle exec rubocop
bundle exec brakeman --no-pager
bundle exec bundler-audit check
npm audit --audit-level=moderate
npm run build
bundle exec rails zeitwerk:check
bundle exec rails sqlite:health
```

## Lacunas conhecidas

Prioridade alta:

- Criar system specs ou Playwright para fluxo real no navegador.
- Endurecer configuracao de producao: SSL, hosts, CSP e `default_url_options`.
- Definir politica de versionamento para `public/vite*`, uploads e assets gerados.

Prioridade media:

- Cobrir admin CRUD com request specs.
- Cobrir permissoes de admin por papel (`admin` vs `operator`), se `operator` entrar no MVP.
- Adicionar reconciliacao periodica entre `fitc_wallets` e soma do ledger.
- Revisar import legado com dados reais em staging.

Prioridade baixa:

- Reduzir tamanho dos chunks Vite com code splitting.
- Remover codigo JS admin obsoleto se nao estiver mais carregado.
- Revisar duplicidade entre pipeline Vite e Tailwind/Propshaft.

## Dados de desenvolvimento

`db/seeds.rb` cria:

- usuarios admin
- categorias
- tags
- presets de variacao
- cards CTA
- catalogo legado importado para produtos

O seed nao cria colaboradores/elegiveis por padrao. Para testar resgate manual,
crie uma elegibilidade em `/admin/colaboradores/elegiveis`, cadastre o
colaborador em `/colaborador/cadastro` e depois acesse `/colaborador/catalogo`.

## Definition of Done do MVP

- Catalogo publico carrega com produtos e imagens.
- Colaborador elegivel consegue criar conta e fazer login.
- Colaborador nao elegivel nao consegue criar conta.
- Saldo FITC aparece para colaborador logado.
- Resgate com saldo suficiente debita saldo e cria pedido.
- Resgate com saldo insuficiente nao cria pedido nem ledger.
- Admin consegue ajustar saldo, ver pedido e estornar.
- `bundle exec rspec`, `bundle exec rubocop`, `npm run build`, `brakeman` e auditorias passam.
