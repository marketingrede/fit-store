<?php

declare(strict_types=1);

namespace App\Support;

final class ProductListPerPage
{
    public const DEFAULT = 15;

    public const SESSION_KEY = 'admin_products_per_page';

    /** @var list<int> */
    private const ALLOWED = [10, 15, 25, 50, 100];

    /** @return list<int> */
    public static function allowed(): array
    {
        return self::ALLOWED;
    }

    public static function resolve(?string $fromRequest): int
    {
        if ($fromRequest !== null && $fromRequest !== '') {
            $value = (int) $fromRequest;
            if (in_array($value, self::ALLOWED, true)) {
                $_SESSION[self::SESSION_KEY] = $value;

                return $value;
            }
        }

        $stored = $_SESSION[self::SESSION_KEY] ?? null;
        if (is_int($stored) && in_array($stored, self::ALLOWED, true)) {
            return $stored;
        }

        return self::DEFAULT;
    }
}
