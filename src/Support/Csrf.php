<?php

declare(strict_types=1);

namespace App\Support;

final class Csrf
{
    public static function token(): string
    {
        return $_SESSION['_csrf'] ?? '';
    }

    public static function validate(?string $token): bool
    {
        return is_string($token)
            && $token !== ''
            && hash_equals(self::token(), $token);
    }
}
