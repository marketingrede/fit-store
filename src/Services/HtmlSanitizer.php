<?php

declare(strict_types=1);

namespace App\Services;

final class HtmlSanitizer
{
    private const ALLOWED = '<p><br><strong><b><em><i><u><s><h1><h2><h3><ul><ol><li><a><blockquote>';

    public function clean(?string $html): string
    {
        if ($html === null || $html === '') {
            return '';
        }

        $html = strip_tags($html, self::ALLOWED);

        return preg_replace('/\s+on\w+="[^"]*"/i', '', $html) ?? $html;
    }
}
