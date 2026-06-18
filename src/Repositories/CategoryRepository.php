<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Database;

final class CategoryRepository
{
    public function __construct(private readonly Database $db)
    {
    }

    /** @return list<array<string, mixed>> */
    public function all(): array
    {
        $stmt = $this->db->pdo()->query(
            'SELECT * FROM catalog_categories ORDER BY sort_order ASC, label ASC'
        );

        return $stmt->fetchAll();
    }

    /** @return array<string, string> slug => label */
    public function activeMap(): array
    {
        $stmt = $this->db->pdo()->query(
            'SELECT slug, label FROM catalog_categories WHERE active = 1 ORDER BY sort_order ASC, label ASC'
        );

        $map = [];
        foreach ($stmt->fetchAll() as $row) {
            $map[$row['slug']] = $row['label'];
        }

        return $map;
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->pdo()->prepare('SELECT * FROM catalog_categories WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function slugExists(string $slug, ?int $exceptId = null): bool
    {
        $sql = 'SELECT 1 FROM catalog_categories WHERE slug = ?';
        $params = [$slug];

        if ($exceptId !== null) {
            $sql .= ' AND id != ?';
            $params[] = $exceptId;
        }

        $stmt = $this->db->pdo()->prepare($sql);
        $stmt->execute($params);

        return (bool) $stmt->fetchColumn();
    }

    public function create(string $slug, string $label, int $sortOrder = 0, bool $active = true): int
    {
        $stmt = $this->db->pdo()->prepare(
            'INSERT INTO catalog_categories (slug, label, sort_order, active) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$slug, $label, $sortOrder, $active ? 1 : 0]);

        return (int) $this->db->pdo()->lastInsertId();
    }

    public function update(int $id, string $slug, string $label, int $sortOrder, bool $active): void
    {
        $stmt = $this->db->pdo()->prepare(
            'UPDATE catalog_categories SET slug = ?, label = ?, sort_order = ?, active = ? WHERE id = ?'
        );
        $stmt->execute([$slug, $label, $sortOrder, $active ? 1 : 0, $id]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->pdo()->prepare('DELETE FROM catalog_categories WHERE id = ?');
        $stmt->execute([$id]);
    }
}
