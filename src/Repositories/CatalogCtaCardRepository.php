<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Database;

final class CatalogCtaCardRepository
{
    public function __construct(private readonly Database $database)
    {
    }

    /** @return list<array<string, mixed>> */
    public function all(): array
    {
        $this->ensureDefaults();

        return $this->database->pdo()
            ->query('SELECT * FROM catalog_cta_cards ORDER BY slot ASC')
            ->fetchAll();
    }

    /** @return array<int, array<string, mixed>> */
    public function activeBySlot(): array
    {
        $items = array_filter(
            $this->all(),
            fn (array $item) => (int) ($item['active'] ?? 0) === 1
        );

        $bySlot = [];
        foreach ($items as $item) {
            $bySlot[(int) $item['slot']] = $item;
        }

        return $bySlot;
    }

    public function updateSlot(int $slot, array $data): void
    {
        $this->ensureDefaults();

        $stmt = $this->database->pdo()->prepare(
            'UPDATE catalog_cta_cards SET
                variant = :variant,
                title = :title,
                body = :body,
                link_url = :link_url,
                link_label = :link_label,
                image_url = :image_url,
                active = :active,
                updated_at = datetime(\'now\')
             WHERE slot = :slot'
        );

        $stmt->execute([
            'slot' => $slot,
            'variant' => $data['variant'],
            'title' => $data['title'],
            'body' => $data['body'],
            'link_url' => $data['link_url'],
            'link_label' => $data['link_label'],
            'image_url' => $data['image_url'],
            'active' => $data['active'] ? 1 : 0,
        ]);
    }

    public function setActive(int $slot, bool $active): void
    {
        $this->ensureDefaults();

        $stmt = $this->database->pdo()->prepare(
            'UPDATE catalog_cta_cards SET active = :active, updated_at = datetime(\'now\') WHERE slot = :slot'
        );
        $stmt->execute([
            'slot' => $slot,
            'active' => $active ? 1 : 0,
        ]);
    }

    private function ensureDefaults(): void
    {
        $stmt = $this->database->pdo()->prepare(
            'INSERT OR IGNORE INTO catalog_cta_cards (slot, variant, title, body, link_label, active)
             VALUES (:slot, :variant, :title, :body, :link_label, 1)'
        );

        $stmt->execute([
            'slot' => 1,
            'variant' => 'teal',
            'title' => 'Troque seus Fitcoin',
            'body' => 'Resgate equipamentos e suplementos com seu saldo Movimenta+.',
            'link_label' => 'Ver catálogo',
        ]);
        $stmt->execute([
            'slot' => 2,
            'variant' => 'blue',
            'title' => 'Como funciona',
            'body' => 'Escolha o produto, confirme o resgate e receba o retorno por e-mail.',
            'link_label' => 'Saiba mais',
        ]);
    }
}
