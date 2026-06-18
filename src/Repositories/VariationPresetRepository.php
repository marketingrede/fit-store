<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Database;

final class VariationPresetRepository
{
    public function __construct(private readonly Database $db)
    {
    }

    /** @return list<array<string, mixed>> */
    public function all(): array
    {
        $stmt = $this->db->pdo()->query(
            'SELECT * FROM variation_presets ORDER BY sort_order ASC, name ASC'
        );

        return array_map([$this, 'hydrate'], $stmt->fetchAll());
    }

    /** @return list<array<string, mixed>> */
    public function allActive(): array
    {
        $stmt = $this->db->pdo()->query(
            'SELECT * FROM variation_presets WHERE active = 1 ORDER BY sort_order ASC, name ASC'
        );

        return array_map([$this, 'hydrate'], $stmt->fetchAll());
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->pdo()->prepare('SELECT * FROM variation_presets WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return $row ? $this->hydrate($row) : null;
    }

    /** @param list<string> $options */
    public function create(
        string $name,
        string $unit,
        bool $required,
        bool $allowOptionImage,
        array $options,
        int $sortOrder = 0,
        bool $active = true,
    ): int {
        $stmt = $this->db->pdo()->prepare(
            'INSERT INTO variation_presets (name, unit, required, allow_option_image, options_json, sort_order, active)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $name,
            $unit,
            $required ? 1 : 0,
            $allowOptionImage ? 1 : 0,
            json_encode(array_values($options), JSON_UNESCAPED_UNICODE),
            $sortOrder,
            $active ? 1 : 0,
        ]);

        return (int) $this->db->pdo()->lastInsertId();
    }

    /** @param list<string> $options */
    public function update(
        int $id,
        string $name,
        string $unit,
        bool $required,
        bool $allowOptionImage,
        array $options,
        int $sortOrder,
        bool $active,
    ): void {
        $stmt = $this->db->pdo()->prepare(
            'UPDATE variation_presets
             SET name = ?, unit = ?, required = ?, allow_option_image = ?, options_json = ?, sort_order = ?, active = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $name,
            $unit,
            $required ? 1 : 0,
            $allowOptionImage ? 1 : 0,
            json_encode(array_values($options), JSON_UNESCAPED_UNICODE),
            $sortOrder,
            $active ? 1 : 0,
            $id,
        ]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->pdo()->prepare('DELETE FROM variation_presets WHERE id = ?');
        $stmt->execute([$id]);
    }

  /** @param array<string, mixed> $row */
    private function hydrate(array $row): array
    {
        $options = json_decode((string) ($row['options_json'] ?? '[]'), true);
        $row['options'] = is_array($options) ? array_values($options) : [];

        return $row;
    }
}
