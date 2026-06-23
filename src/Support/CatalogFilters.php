<?php

declare(strict_types=1);

namespace App\Support;

use Psr\Http\Message\ServerRequestInterface;

final class CatalogFilters
{
    /**
     * @return array{search: string, categories: list<string>, valid_categories: list<string>, tags: list<string>, valid_tags: list<string>, price_min: int, price_max: int}
     */
    public static function fromRequest(ServerRequestInterface $request, CatalogConfig $catalog): array
    {
        $params = $request->getQueryParams();
        $search = trim((string) ($params['q'] ?? ''));
        $categories = self::parseCategories($params);
        $tags = self::parseListParam($params, 'tags');
        $validCategories = array_values(array_filter(
            $categories,
            fn (string $slug) => $catalog->isValidCategory($slug)
        ));
        $validTagNames = array_column($catalog->activeTags(), 'name');
        $validTags = array_values(array_filter(
            $tags,
            fn (string $name) => in_array($name, $validTagNames, true)
        ));

        $priceMin = max(0, (int) ($params['preco_min'] ?? 0));
        $priceMax = max(0, (int) ($params['preco_max'] ?? 0));

        return [
            'search' => $search,
            'categories' => $categories,
            'valid_categories' => $validCategories,
            'tags' => $tags,
            'valid_tags' => $validTags,
            'price_min' => $priceMin,
            'price_max' => $priceMax,
        ];
    }

    /** @return list<string> */
    public static function parseCategories(array $params): array
    {
        if (!empty($params['categorias'])) {
            return self::parseListParam($params, 'categorias', true);
        }

        $single = trim((string) ($params['categoria'] ?? ''));
        if ($single !== '' && $single !== 'all') {
            return [$single];
        }

        return [];
    }

    /** @return list<string> */
    private static function parseListParam(array $params, string $key, bool $lowercase = false): array
    {
        if (empty($params[$key])) {
            return [];
        }

        $rawValues = is_array($params[$key])
            ? $params[$key]
            : [$params[$key]];

        $raw = [];
        foreach ($rawValues as $value) {
            foreach (explode(',', (string) $value) as $part) {
                $raw[] = $part;
            }
        }

        return array_values(array_unique(array_filter(array_map(
            function ($value) use ($lowercase) {
                $value = trim((string) $value);

                return $lowercase ? strtolower($value) : $value;
            },
            $raw
        ))));
    }
}
