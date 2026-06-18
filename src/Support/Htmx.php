<?php

declare(strict_types=1);

namespace App\Support;

use Psr\Http\Message\ServerRequestInterface;

final class Htmx
{
    public static function isRequest(ServerRequestInterface $request): bool
    {
        return strtolower($request->getHeaderLine('HX-Request')) === 'true';
    }
}
