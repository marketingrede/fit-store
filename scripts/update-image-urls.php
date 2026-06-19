<?php

declare(strict_types=1);

/**
 * Atualiza image_url no SQLite local após optimize-uploads.mjs.
 * Lê JSON via stdin: [{ "oldPublic": "/uploads/...", "newPublic": "/uploads/..." }, ...]
 */

$stdin = stream_get_contents(STDIN);
$mapping = json_decode($stdin ?: '[]', true);
if (!is_array($mapping) || $mapping === []) {
    fwrite(STDERR, "Nenhum mapeamento recebido.\n");
    exit(1);
}

$root = dirname(__DIR__);
$dbPath = $root . '/data/app.db';
if (!is_file($dbPath)) {
    fwrite(STDERR, "Banco local não encontrado: {$dbPath}\n");
    exit(0);
}

$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$tables = ['products', 'product_attribute_options', 'catalog_cta_cards', 'announcements'];

$pdo->beginTransaction();
foreach ($mapping as $row) {
    $old = (string) ($row['oldPublic'] ?? '');
    $new = (string) ($row['newPublic'] ?? '');
    if ($old === '' || $new === '' || $old === $new) {
        continue;
    }
    foreach ($tables as $table) {
        $stmt = $pdo->prepare("UPDATE {$table} SET image_url = ? WHERE image_url = ?");
        $stmt->execute([$new, $old]);
    }
}
$pdo->commit();

echo "OK\n";
