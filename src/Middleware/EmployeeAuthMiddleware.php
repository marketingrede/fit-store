<?php

declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

final class EmployeeAuthMiddleware implements MiddlewareInterface
{
    public function process(
        ServerRequestInterface $request,
        RequestHandlerInterface $handler
    ): ResponseInterface {
        if (empty($_SESSION['employee_id'])) {
            $response = new Response();
            return $response
                ->withHeader('Location', '/colaborador/login')
                ->withStatus(302);
        }

        return $handler->handle($request);
    }
}
