# Fit Store — Movimenta+

Loja virtual completa em **PHP Slim 4 + SQLite** com painel administrativo.

## Funcionalidades

### Loja pública
- Catálogo com busca e filtros por categoria
- Página de produto com imagem e preço em Fitcoin
- Carrossel de anúncios publicados
- Fluxo de troca: modal → resumo → confirmação → e-mail/SQLite

### Painel admin (`/admin`)
- Login com proteção contra brute force
- Dashboard com métricas e últimas trocas
- **CRUD de produtos** (ativo/inativo, upload ou URL de imagem)
- **CRUD de anúncios** (Quill WYSIWYG + Cropper.js 16:9)
- Listagem de **solicitações de troca**
- Alteração de senha

## Instalação

```bash
composer install
cp .env.example .env
npm install
npm run build
```

Logo:

```bash
mkdir -p public/imagens
cp "Imagens Site/LOGO Movimenta + (V).jpg" public/imagens/logo.jpg
```

### Desenvolvimento

```bash
composer start          # http://localhost:8080
npm run dev             # watch de assets (opcional)
```

### Docker / Easypanel

```bash
docker compose up --build
```

### Render + Turso (produção)

Ver [docs/deploy-render-turso.md](docs/deploy-render-turso.md).

Volumes persistentes (Docker local):
- `./data` → SQLite
- `./public/uploads` → imagens

## Credenciais admin

No `.env`, a senha inicial (`ADMIN_PASSWORD`) é aplicada aos administradores criados no seed:

- `epilian.silva@redemontagens.com.br`
- `raillen.santos@redemontagens.com.br`

```
ADMIN_PASSWORD=altere-esta-senha
SESSION_SECRET=gere-uma-chave-aleatoria
```

## Rotas

| Rota | Descrição |
|------|-----------|
| `GET /` | Catálogo |
| `GET /produto/{id}` | Detalhe do produto |
| `POST /api/troca-fitcoin` | Solicitação de troca |
| `GET /admin` | Dashboard |
| `GET /admin/produtos` | Gestão de produtos |
| `GET /admin/anuncios` | Gestão de anúncios |
| `GET /admin/trocas` | Solicitações de troca |
| `GET /admin/conta` | Alterar senha |

## Estrutura

```
public/           Document root
src/              PHP (controllers, repos, services)
templates/        Twig
database/         Schema + seed
resources/        CSS/JS (Vite)
data/app.db       SQLite
legacy/           Site estático antigo
```

## Backup

Faça backup periódico de:
- `data/app.db`
- `public/uploads/`
