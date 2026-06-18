<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Database;
use PDO;

final class ProductVariationRepository
{
    public function __construct(private readonly Database $database)
    {
    }

    /** @return array<int, list<array<string, mixed>>> */
    public function groupedByProductIds(array $productIds): array
    {
        if ($productIds === []) {
            return [];
        }

        $placeholders = [];
        $params = [];
        foreach (array_values($productIds) as $i => $id) {
            $key = 'pid' . $i;
            $placeholders[] = ':' . $key;
            $params[$key] = $id;
        }

        $sql = 'SELECT * FROM product_attributes WHERE product_id IN (' . implode(', ', $placeholders) . ') ORDER BY sort_order ASC, id ASC';
        $stmt = $this->database->pdo()->prepare($sql);
        $stmt->execute($params);
        $attributes = $stmt->fetchAll();

        if ($attributes === []) {
            return [];
        }

        $attrIds = array_column($attributes, 'id');
        $optionsByAttr = $this->optionsForAttributeIds($attrIds);

        $grouped = [];
        foreach ($attributes as $attr) {
            $productId = (int) $attr['product_id'];
            $attrId = (int) $attr['id'];
            $grouped[$productId][] = $this->formatAttribute($attr, $optionsByAttr[$attrId] ?? []);
        }

        return $grouped;
    }

    /** @return list<array<string, mixed>> */
    public function forProduct(int $productId): array
    {
        $grouped = $this->groupedByProductIds([$productId]);

        return $grouped[$productId] ?? [];
    }

    /**
     * @param list<array<string, mixed>> $attributes
     */
    public function syncForProduct(int $productId, array $attributes): void
    {
        $pdo = $this->database->pdo();
        $pdo->beginTransaction();

        try {
            $delete = $pdo->prepare('DELETE FROM product_attributes WHERE product_id = ?');
            $delete->execute([$productId]);

            $insertAttr = $pdo->prepare(
                'INSERT INTO product_attributes (product_id, name, unit, required, allow_option_image, sort_order)
                 VALUES (:product_id, :name, :unit, :required, :allow_option_image, :sort_order)'
            );

            $insertOpt = $pdo->prepare(
                'INSERT INTO product_attribute_options (attribute_id, label, image_url, price_fitc_override, sort_order)
                 VALUES (:attribute_id, :label, :image_url, :price_fitc_override, :sort_order)'
            );

            foreach (array_values($attributes) as $sort => $attr) {
                $name = trim((string) ($attr['name'] ?? ''));
                if ($name === '') {
                    continue;
                }

                $insertAttr->execute([
                    'product_id' => $productId,
                    'name' => $name,
                    'unit' => trim((string) ($attr['unit'] ?? '')) ?: null,
                    'required' => !empty($attr['required']) ? 1 : 0,
                    'allow_option_image' => !empty($attr['allow_option_image']) ? 1 : 0,
                    'sort_order' => $sort,
                ]);

                $attributeId = (int) $pdo->lastInsertId();
                $options = is_array($attr['options'] ?? null) ? $attr['options'] : [];

                foreach (array_values($options) as $optSort => $opt) {
                    $label = trim((string) ($opt['label'] ?? ''));
                    if ($label === '') {
                        continue;
                    }

                    $priceOverride = $opt['price_fitc_override'] ?? null;
                    $priceOverride = ($priceOverride === '' || $priceOverride === null)
                        ? null
                        : (int) $priceOverride;

                    $insertOpt->execute([
                        'attribute_id' => $attributeId,
                        'label' => $label,
                        'image_url' => trim((string) ($opt['image_url'] ?? '')) ?: null,
                        'price_fitc_override' => $priceOverride,
                        'sort_order' => $optSort,
                    ]);
                }
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    /** @return array<int, list<array<string, mixed>>> */
    private function optionsForAttributeIds(array $attributeIds): array
    {
        if ($attributeIds === []) {
            return [];
        }

        $placeholders = [];
        $params = [];
        foreach (array_values($attributeIds) as $i => $id) {
            $key = 'aid' . $i;
            $placeholders[] = ':' . $key;
            $params[$key] = $id;
        }

        $sql = 'SELECT * FROM product_attribute_options WHERE attribute_id IN (' . implode(', ', $placeholders) . ') ORDER BY sort_order ASC, id ASC';
        $stmt = $this->database->pdo()->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $grouped = [];
        foreach ($rows as $row) {
            $attrId = (int) $row['attribute_id'];
            $grouped[$attrId][] = [
                'id' => (int) $row['id'],
                'label' => (string) $row['label'],
                'image_url' => $row['image_url'] ?: null,
                'price_fitc_override' => $row['price_fitc_override'] !== null
                    ? (int) $row['price_fitc_override']
                    : null,
            ];
        }

        return $grouped;
    }

    /** @param list<array<string, mixed>> $options */
    private function formatAttribute(array $attr, array $options): array
    {
        return [
            'id' => (int) $attr['id'],
            'name' => (string) $attr['name'],
            'unit' => $attr['unit'] ?: null,
            'required' => (bool) $attr['required'],
            'allow_option_image' => (bool) $attr['allow_option_image'],
            'options' => $options,
        ];
    }
}
