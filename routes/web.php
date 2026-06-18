<?php

declare(strict_types=1);

use App\Controllers\AnnouncementController;
use App\Controllers\CatalogController;
use App\Controllers\HomeController;
use App\Controllers\ProductController;
use App\Controllers\TradeController;
use Slim\App;

return function (App $app): void {
    $app->get('/health', function ($request, $response) {
        $response->getBody()->write(json_encode(['ok' => true]));
        return $response->withHeader('Content-Type', 'application/json');
    });

    $app->get('/', [HomeController::class, 'index']);
    $app->get('/produto/{id:[0-9]+}', [ProductController::class, 'show']);
    $app->post('/api/troca-fitcoin', [TradeController::class, 'submit']);

    $app->get('/partials/home', [HomeController::class, 'index']);
    $app->get('/partials/produto/{id:[0-9]+}', [ProductController::class, 'show']);
    $app->get('/api/announcements', [AnnouncementController::class, 'published']);
    $app->get('/api/catalog/products', [CatalogController::class, 'products']);

    $app->get('/index.html', fn ($req, $res) => $res->withHeader('Location', '/')->withStatus(301));
    $app->get('/produto.html', function ($req, $res) {
        $id = $req->getQueryParams()['id'] ?? null;
        if ($id) {
            return $res->withHeader('Location', '/produto/' . (int) $id)->withStatus(301);
        }
        return $res->withHeader('Location', '/')->withStatus(301);
    });
};
