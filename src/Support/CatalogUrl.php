<?php

declare(strict_types=1);

namespace App\Support;

final class CatalogUrl
{
    public static function build(string $q = '', array $categories = [], array $tags = []): string
    {
        $params = [];
        if ($q !== '') {
            $params['q'] = $q;
        }
        if ($categories !== []) {
            $params['categorias'] = implode(',', $categories);
        }
        if ($tags !== []) {
            $params['tags'] = implode(',', $tags);
        }

        $qs = http_build_query($params);

        return $qs !== '' ? '/?' . $qs : '/';
    }

    public static function toggleCategory(string $q, array $active, string $slug, array $tags = []): string
    {
        $categories = in_array($slug, $active, true)
            ? array_values(array_filter($active, fn (string $c) => $c !== $slug))
            : [...$active, $slug];

        return self::build($q, $categories, $tags);
    }

    public static function removeCategory(string $q, array $active, string $slug, array $tags = []): string
    {
        return self::build($q, array_values(array_filter($active, fn (string $c) => $c !== $slug)), $tags);
    }

    public static function toggleTag(string $q, array $categories, array $active, string $tag): string
    {
        $tags = in_array($tag, $active, true)
            ? array_values(array_filter($active, fn (string $t) => $t !== $tag))
            : [...$active, $tag];

        return self::build($q, $categories, $tags);
    }

    public static function removeTag(string $q, array $categories, array $active, string $tag): string
    {
        return self::build($q, $categories, array_values(array_filter($active, fn (string $t) => $t !== $tag)));
    }
}
