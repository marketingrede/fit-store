<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Database;
use PDO;

final class AnnouncementRepository
{
    public function __construct(private readonly Database $database)
    {
    }

    public function published(int $limit = 10): array
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT * FROM announcements
             WHERE status = :status
             ORDER BY published_at DESC
             LIMIT :limit'
        );
        $stmt->bindValue('status', 'published');
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function all(): array
    {
        return $this->database->pdo()
            ->query('SELECT * FROM announcements ORDER BY created_at DESC')
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->database->pdo()->prepare('SELECT * FROM announcements WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function slugExists(string $slug, ?int $exceptId = null): bool
    {
        $sql = 'SELECT COUNT(*) FROM announcements WHERE slug = ?';
        $params = [$slug];

        if ($exceptId !== null) {
            $sql .= ' AND id != ?';
            $params[] = $exceptId;
        }

        $stmt = $this->database->pdo()->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn() > 0;
    }

    public function create(array $data): int
    {
        $stmt = $this->database->pdo()->prepare(
            'INSERT INTO announcements (title, slug, content_html, image_url, crop_data, status, published_at, created_by)
             VALUES (:title, :slug, :content_html, :image_url, :crop_data, :status, :published_at, :created_by)'
        );
        $stmt->execute($data);

        return (int) $this->database->pdo()->lastInsertId();
    }

    public function update(int $id, array $data): void
    {
        $data['id'] = $id;
        $stmt = $this->database->pdo()->prepare(
            'UPDATE announcements SET
                title = :title,
                slug = :slug,
                content_html = :content_html,
                image_url = :image_url,
                crop_data = :crop_data,
                status = :status,
                published_at = :published_at,
                updated_at = datetime(\'now\')
             WHERE id = :id'
        );
        $stmt->execute($data);
    }

    public function delete(int $id): void
    {
        $this->database->pdo()->prepare('DELETE FROM announcements WHERE id = ?')->execute([$id]);
    }
}
