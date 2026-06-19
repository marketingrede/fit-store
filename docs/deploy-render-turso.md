# Deploy: Render + Turso

Guia para publicar o Fit Store com **Render** (app PHP/Docker) e **Turso** (banco SQLite na nuvem).

## Visão geral

```
Render (Docker)  →  app PHP + Apache
Turso            →  banco libSQL (dados persistentes)
```

Localmente, sem variáveis Turso, o app continua usando `data/app.db`.

---

## 1. Criar banco no Turso

Instale a CLI: https://docs.turso.tech/cli

```bash
turso auth login
turso db create fit-store
turso db show fit-store --url
turso db tokens create fit-store
```

Guarde:

- `TURSO_DATABASE_URL` — ex.: `libsql://fit-store-usuario.turso.io`
- `TURSO_AUTH_TOKEN` — token gerado acima

### Importar dados existentes (opcional)

Se você já tem `data/app.db` local:

```bash
turso db import fit-store --from-db-file ./data/app.db
```

Ou só o schema + seeds (banco vazio na nuvem):

```bash
turso db shell fit-store < database/schema.sql
```

As migrations rodam automaticamente na primeira subida do app.

---

## 2. Deploy no Render

1. Faça push do repositório para o GitHub.
2. Em [render.com](https://render.com) → **New** → **Blueprint** (ou Web Service).
3. Conecte o repositório. O arquivo `render.yaml` na raiz configura o serviço.
4. Em **Environment**, defina:

| Variável | Exemplo |
|----------|---------|
| `APP_URL` | `https://fit-store-xxxx.onrender.com` |
| `ADMIN_PASSWORD` | senha forte para admins do seed |
| `TURSO_DATABASE_URL` | `libsql://...` |
| `TURSO_AUTH_TOKEN` | token do Turso |
| `SESSION_SECRET` | gerado pelo Render ou string aleatória longa |

`APP_ENV=production` e `APP_DEBUG=false` já vêm do `render.yaml`.

5. **Deploy**. O build usa o `Dockerfile` (PHP 8.3 + FFI + assets Vite).

---

## 3. Após o deploy

- Loja: `https://seu-servico.onrender.com`
- Admin: `https://seu-servico.onrender.com/admin`
- Logins do seed: e-mails em `database/seeds/admins.php` + `ADMIN_PASSWORD`

---

## 4. Uploads de imagens (importante)

No plano **gratuito** do Render, o disco é **efêmero**: imagens enviadas pelo admin podem **sumir** após redeploy.

Opções:

1. **Disco persistente no Render** (pago) montado em `public/uploads`
2. **Storage externo** (Cloudinary, Supabase Storage, S3) — exige adaptação futura do `UploadService`
3. Usar **URLs de imagem** em vez de upload, quando possível

O **banco Turso** não é afetado — só arquivos locais em `public/uploads/`.

---

## 5. Desenvolvimento local

### Só SQLite (padrão)

```bash
composer install
cp .env.example .env
npm install && npm run build
composer start
```

### Com Turso remoto

No `.env`:

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

Requisitos: **PHP 8.3+** e extensão **FFI** habilitada.

---

## 6. Variáveis opcionais

| Variável | Descrição |
|----------|-----------|
| `TURSO_REPLICA_PATH` | Caminho local para réplica embutida (ex.: `data/replica.db`) |
| `TURSO_SYNC_INTERVAL` | Intervalo de sync em segundos (padrão: 60) |
| `DB_PATH` | SQLite local quando Turso não está configurado |

---

## 7. Troubleshooting

| Problema | Solução |
|----------|---------|
| Erro FFI / libsql | Confirme PHP 8.3 + `ffi.enable=1` no Docker |
| Admin não loga | Verifique `ADMIN_PASSWORD` e se os admins existem no Turso |
| Loja vazia | Importe `app.db` ou deixe o seed rodar (`products` vazio) |
| App lento ao acordar | Plano free do Render dorme após inatividade — primeiro acesso demora ~30s |

---

## Backup

- **Turso:** `turso db shell fit-store .dump > backup.sql` ou export pelo dashboard
- **Uploads:** copie `public/uploads/` se ainda estiverem no disco
