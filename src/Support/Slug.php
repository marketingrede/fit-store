<?php

declare(strict_types=1);

namespace App\Support;

final class Slug
{
    public static function from(string $text): string
    {
        $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text) ?: $text;
        $text = strtolower($text);
        $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';
        $text = trim($text, '-');

        return $text !== '' ? $text : 'item';
    }

    public static function unique(string $base, callable $exists): string
    {
        $slug = self::from($base);
        $candidate = $slug;
        $i = 2;

        while ($exists($candidate)) {
            $candidate = $slug . '-' . $i;
            $i++;
        }

        return $candidate;
    }
}
