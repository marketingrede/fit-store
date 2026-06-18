<?php

declare(strict_types=1);

namespace App\Support;

final class ProductListSort
{
    private const COLUMNS = ['id', 'name', 'category', 'tag', 'price_fitc', 'active'];

    /** @return array{sort: string, dir: string} */
    public static function parse(?string $sort, ?string $dir): array
    {
        $column = in_array($sort, self::COLUMNS, true) ? $sort : 'id';
        $direction = strtolower((string) $dir) === 'desc' ? 'desc' : 'asc';

        return ['sort' => $column, 'dir' => $direction];
    }
}
