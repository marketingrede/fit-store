/**
 * Otimiza imagens em public/uploads para deploy.
 * Redimensiona e converte para WebP (qualidade 88 — imperceptível nos cards da loja).
 *
 * Uso: node scripts/optimize-uploads.mjs [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const uploadsRoot = path.join(root, 'public', 'uploads');
const dryRun = process.argv.includes('--dry-run');

const QUALITY = 88;
const MAX_PRODUCT = 1200;
const MAX_CTA = 1600;

function maxSizeFor(relPath) {
  return relPath.includes('catalog-ctas') ? MAX_CTA : MAX_PRODUCT;
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(png|jpe?g)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

async function optimizeFile(absPath) {
  const rel = path.relative(uploadsRoot, absPath).replace(/\\/g, '/');
  const webpPath = absPath.replace(/\.(png|jpe?g)$/i, '.webp');
  const max = maxSizeFor(rel);
  const before = fs.statSync(absPath).size;

  if (dryRun) {
    const meta = await sharp(absPath).metadata();
    return {
      rel,
      before,
      after: null,
      saved: 0,
      note: `${meta.width}x${meta.height} → max ${max}px WebP q${QUALITY}`,
    };
  }

  const buffer = await sharp(absPath)
    .rotate()
    .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toBuffer();

  fs.writeFileSync(webpPath, buffer);
  if (webpPath !== absPath) fs.unlinkSync(absPath);

  const oldPublic = '/uploads/' + rel;
  const newPublic = oldPublic.replace(/\.(png|jpe?g)$/i, '.webp');

  return {
    rel,
    before,
    after: buffer.length,
    saved: before - buffer.length,
    oldPublic,
    newPublic,
  };
}

function writeTursoSql(mapping) {
  const tables = ['products', 'product_attribute_options', 'catalog_cta_cards', 'announcements'];
  const lines = ['-- turso db shell fit-store < scripts/update-turso-image-urls.sql'];
  for (const { oldPublic, newPublic } of mapping) {
    for (const table of tables) {
      lines.push(`UPDATE ${table} SET image_url = '${newPublic}' WHERE image_url = '${oldPublic}';`);
    }
  }
  const out = path.join(__dirname, 'update-turso-image-urls.sql');
  fs.writeFileSync(out, lines.join('\n') + '\n');
  return out;
}

function updateLocalDb(mapping) {
  const php = path.join(__dirname, 'update-image-urls.php');
  if (!fs.existsSync(php)) return;
  const payload = JSON.stringify(mapping);
  const r = spawnSync('php', [php], { input: payload, cwd: root, encoding: 'utf8' });
  if (r.status !== 0) {
    console.warn('Aviso: não foi possível atualizar data/app.db:', r.stderr || r.stdout);
  }
}

const files = walk(uploadsRoot);
if (files.length === 0) {
  console.log('Nenhuma imagem PNG/JPEG em public/uploads.');
  process.exit(0);
}

let totalBefore = 0;
let totalAfter = 0;
const mapping = [];

for (const file of files) {
  const result = await optimizeFile(file);
  totalBefore += result.before;
  if (result.after != null) {
    totalAfter += result.after;
    if (result.oldPublic !== result.newPublic) mapping.push(result);
  }
  const savedPct = result.after
    ? `-${Math.round((result.saved / result.before) * 100)}%`
    : result.note;
  const afterKb = result.after ? `${Math.round(result.after / 1024)} KB` : '?';
  console.log(`${result.rel}: ${Math.round(result.before / 1024)} KB → ${afterKb}  ${savedPct}`);
}

if (!dryRun && mapping.length > 0) {
  writeTursoSql(mapping);
  updateLocalDb(mapping);
  console.log('\nGerado: scripts/update-turso-image-urls.sql');
  console.log('Atualizado: data/app.db (URLs .png → .webp)');
}

if (!dryRun) {
  const pct = Math.round(((totalBefore - totalAfter) / totalBefore) * 100);
  console.log(`\nTotal: ${(totalBefore / 1024 / 1024).toFixed(1)} MB → ${(totalAfter / 1024 / 1024).toFixed(1)} MB (-${pct}%)`);
}
