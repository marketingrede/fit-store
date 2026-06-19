<?php

declare(strict_types=1);

namespace App\Database;

use Libsql\Database as LibsqlDatabase;
use PDO;

final class Database
{
  private PDO|LibsqlPdo $pdo;

  private ?LibsqlDatabase $libsqlDatabase = null;

  public function __construct(private readonly string $root)
  {
    $tursoUrl = trim((string) ($_ENV['TURSO_DATABASE_URL'] ?? ''));
    $tursoToken = trim((string) ($_ENV['TURSO_AUTH_TOKEN'] ?? ''));

    if ($tursoUrl !== '' && $tursoToken !== '') {
      $this->libsqlDatabase = $this->createLibsqlDatabase($tursoUrl, $tursoToken);
      $this->pdo = new LibsqlPdo($this->libsqlDatabase->connect());
      $this->pdo->exec('PRAGMA foreign_keys = ON');

      return;
    }

    $dataDir = $this->root . '/data';
    if (!is_dir($dataDir)) {
      mkdir($dataDir, 0755, true);
    }

    $dbPath = $_ENV['DB_PATH'] ?? 'data/app.db';
    $absolutePath = str_starts_with($dbPath, '/')
      ? $dbPath
      : $this->root . '/' . $dbPath;

    $this->pdo = new PDO('sqlite:' . $absolutePath, null, null, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $this->pdo->exec('PRAGMA foreign_keys = ON');
    $this->pdo->exec('PRAGMA journal_mode = WAL');
  }

  public function pdo(): PDO|LibsqlPdo
  {
    return $this->pdo;
  }

  public function migrate(): void
  {
    $schema = file_get_contents($this->root . '/database/schema.sql');
    $this->pdo->exec($schema);

    $migrationsDir = $this->root . '/database/migrations';
    if (!is_dir($migrationsDir)) {
      $this->seedAdminsIfMissing();

      return;
    }

    $this->pdo->exec(
      'CREATE TABLE IF NOT EXISTS schema_migrations (
          filename TEXT PRIMARY KEY,
          applied_at TEXT NOT NULL DEFAULT (datetime(\'now\'))
      )'
    );

    $files = glob($migrationsDir . '/*.sql') ?: [];
    sort($files);

    $check = $this->pdo->prepare('SELECT 1 FROM schema_migrations WHERE filename = ?');
    $insert = $this->pdo->prepare('INSERT INTO schema_migrations (filename) VALUES (?)');

    foreach ($files as $file) {
      $name = basename($file);
      $check->execute([$name]);
      if ($check->fetchColumn()) {
        continue;
      }

      $this->pdo->exec(file_get_contents($file));
      $insert->execute([$name]);
    }

    $this->seedAdminsIfMissing();
  }

  public function seedIfEmpty(): void
  {
    $count = (int) $this->pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
    if ($count > 0) {
      return;
    }

    $products = require $this->root . '/database/seeds/products.php';
    $stmt = $this->pdo->prepare(
      'INSERT INTO products (id, name, category, price_fitc, description, image_url, tag, active)
       VALUES (:id, :name, :category, :price_fitc, :description, :image_url, :tag, 1)'
    );

    foreach ($products as $product) {
      $stmt->execute($product);
    }
  }

  private function createLibsqlDatabase(string $url, string $token): LibsqlDatabase
  {
    $replicaPath = trim((string) ($_ENV['TURSO_REPLICA_PATH'] ?? ''));

    if ($replicaPath !== '') {
      $absoluteReplica = str_starts_with($replicaPath, '/')
        ? $replicaPath
        : $this->root . '/' . $replicaPath;

      $replicaDir = dirname($absoluteReplica);
      if (!is_dir($replicaDir)) {
        mkdir($replicaDir, 0755, true);
      }

      return new LibsqlDatabase(
        path: $absoluteReplica,
        url: $url,
        authToken: $token,
        syncInterval: (int) ($_ENV['TURSO_SYNC_INTERVAL'] ?? 60),
      );
    }

    return new LibsqlDatabase(
      url: $url,
      authToken: $token,
    );
  }

  private function seedAdminsIfMissing(): void
  {
    $admins = require $this->root . '/database/seeds/admins.php';
    $password = $_ENV['ADMIN_PASSWORD'] ?? 'altere-esta-senha';
    $hash = password_hash($password, PASSWORD_BCRYPT);

    $check = $this->pdo->prepare('SELECT COUNT(*) FROM users WHERE email = ?');
    $insert = $this->pdo->prepare(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)'
    );

    foreach ($admins as $email) {
      $check->execute([$email]);
      if ((int) $check->fetchColumn() === 0) {
        $insert->execute([$email, $hash, 'admin']);
      }
    }
  }
}
