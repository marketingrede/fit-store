<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Database;

final class TagRepository
{
    public function __construct(private readonly Database $db)
    {
    }

    /** @return list<array<string, mixed>> */
    public function all(): array
    {
        $stmt = $this->db->pdo()->query(
            'SELECT * FROM catalog_tags ORDER BY sort_order ASC, name ASC'
        );

        return $stmt->fetchAll();
    }

    /** @return list<array<string, mixed>> */
    public function allActive(): array
    {
        $stmt = $this->db->pdo()->query(
            'SELECT * FROM catalog_tags WHERE active = 1 ORDER BY sort_order ASC, name ASC'
        );

        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->pdo()->prepare('SELECT * FROM catalog_tags WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function nameExists(string $name, ?int $exceptId = null): bool
    {
        $sql = 'SELECT 1 FROM catalog_tags WHERE name = ? COLLATE NOCASE';
        $params = [$name];

        if ($exceptId !== null) {
            $sql .= ' AND id != ?';
            $params[] = $exceptId;
        }

        $stmt = $this->db->pdo()->prepare($sql);
        $stmt->execute($params);

        return (bool) $stmt->fetchColumn();
    }

    public function create(string $name, ?string $color, int $sortOrder = 0, bool $active = true): int
    {
        $stmt = $this->db->pdo()->prepare(
            'INSERT INTO catalog_tags (name, color, sort_order, active) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$name, $color, $sortOrder, $active ? 1 : 0]);

        return (int) $this->db->pdo()->lastInsertId();
    }

    public function update(int $id, string $name, ?string $color, int $sortOrder, bool $active): void
    {
        $stmt = $this->db->pdo()->prepare(
            'UPDATE catalog_tags SET name = ?, color = ?, sort_order = ?, active = ? WHERE id = ?'
        );
        $stmt->execute([$name, $color, $sortOrder, $active ? 1 : 0, $id]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->pdo()->prepare('DELETE FROM catalog_tags WHERE id = ?');
        $stmt->execute([$id]);
    }
}
