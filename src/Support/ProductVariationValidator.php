<?php

declare(strict_types=1);

namespace App\Support;

final class ProductVariationValidator
{
    /**
     * @param list<array<string, mixed>> $attributes
     * @param array<string, mixed> $selection keyed by attribute id (string)
     * @return array{ok: bool, error?: string, summary?: list<array{attribute: string, label: string}>, price_fitc?: int}
     */
    public static function validate(array $attributes, array $selection, int $basePrice): array
    {
        $summary = [];
        $price = $basePrice;

        foreach ($attributes as $attr) {
            $attrId = (string) ($attr['id'] ?? '');
            $name = (string) ($attr['name'] ?? '');
            $required = !empty($attr['required']);
            $unit = trim((string) ($attr['unit'] ?? ''));
            $chosen = $selection[$attrId] ?? null;

            if ($chosen === null || $chosen === '') {
                if ($required) {
                    return ['ok' => false, 'error' => "Selecione a opção obrigatória: {$name}."];
                }
                continue;
            }

            $optionId = (int) $chosen;
            $option = null;
            foreach ($attr['options'] ?? [] as $opt) {
                if ((int) ($opt['id'] ?? 0) === $optionId) {
                    $option = $opt;
                    break;
                }
            }

            if (!$option) {
                return ['ok' => false, 'error' => 'Opção de variação inválida.'];
            }

            $label = (string) $option['label'];
            if ($unit !== '') {
                $label .= ' ' . $unit;
            }

            $summary[] = ['attribute' => $name, 'label' => $label];

            if (isset($option['price_fitc_override']) && $option['price_fitc_override'] !== null) {
                $price = (int) $option['price_fitc_override'];
            }
        }

        return ['ok' => true, 'summary' => $summary, 'price_fitc' => $price];
    }

    /**
     * @param list<array<string, mixed>> $attributes
     * @return array{ok: bool, error?: string}
     */
    public static function validateAdminDefinition(array $attributes): array
    {
        foreach ($attributes as $attr) {
            $name = trim((string) ($attr['name'] ?? ''));
            if ($name === '') {
                continue;
            }

            $options = is_array($attr['options'] ?? null) ? $attr['options'] : [];
            $labels = array_filter(array_map(
                fn ($opt) => trim((string) ($opt['label'] ?? '')),
                $options
            ));

            if ($labels === []) {
                return ['ok' => false, 'error' => "A variação \"{$name}\" precisa de ao menos uma opção."];
            }
        }

        return ['ok' => true];
    }
}
