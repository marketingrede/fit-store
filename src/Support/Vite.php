<?php

declare(strict_types=1);

namespace App\Support;

final class Vite
{
    private static function manifest(): ?array
    {
        $manifestPath = dirname(__DIR__, 2) . '/public/assets/manifest.json';

        if (!file_exists($manifestPath)) {
            $legacy = dirname(__DIR__, 2) . '/public/assets/.vite/manifest.json';
            if (!file_exists($legacy)) {
                return null;
            }
            $manifestPath = $legacy;
        }

        return json_decode(file_get_contents($manifestPath), true);
    }

    public static function asset(string $entry = 'app'): string
    {
        $manifest = self::manifest();
        if (!$manifest) {
            return '/assets/assets/app.js';
        }

        $key = 'resources/js/' . $entry . '.js';
        $file = $manifest[$key]['file'] ?? null;

        return $file ? '/assets/' . ltrim($file, '/') : '/assets/assets/app.js';
    }

    public static function css(string $entry = 'app'): ?string
    {
        $manifest = self::manifest();
        if (!$manifest) {
            return null;
        }

        $key = 'resources/js/' . $entry . '.js';
        $css = $manifest[$key]['css'][0] ?? null;

        return $css ? '/assets/' . ltrim($css, '/') : null;
    }
}
