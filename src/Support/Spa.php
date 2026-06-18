<?php

declare(strict_types=1);

namespace App\Support;

use Psr\Http\Message\ServerRequestInterface;

final class Spa
{
    public static function isPartial(ServerRequestInterface $request): bool
    {
        $path = $request->getUri()->getPath();
        if (str_starts_with($path, '/partials/')) {
            return true;
        }

        if ($request->getHeaderLine('X-SPA') === '1') {
            return true;
        }

        if (strtolower($request->getHeaderLine('HX-Request')) === 'true') {
            return true;
        }

        return ($request->getQueryParams()['partial'] ?? '') === '1';
    }
}
