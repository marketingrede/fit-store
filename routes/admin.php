<?php

declare(strict_types=1);

use App\Controllers\Admin\AccountController;
use App\Controllers\Admin\AnnouncementController;
use App\Controllers\Admin\AuthController;
use App\Controllers\Admin\DashboardController;
use App\Controllers\Admin\ProductController;
use App\Controllers\Admin\ReportsController;
use App\Controllers\Admin\SettingsController;
use App\Controllers\Admin\TradeRequestController;
use App\Middleware\AuthMiddleware;
use Slim\App;

return function (App $app): void {
    $app->group('/admin', function ($group) {
        $group->get('/login', [AuthController::class, 'loginForm']);
        $group->post('/login', [AuthController::class, 'login']);
        $group->post('/logout', [AuthController::class, 'logout']);
    });

    $app->group('/admin', function ($group) {
        $group->get('', [DashboardController::class, 'index']);
        $group->get('/', [DashboardController::class, 'index']);

        $group->get('/produtos', [ProductController::class, 'index']);
        $group->get('/produtos/novo', [ProductController::class, 'createForm']);
        $group->post('/produtos', [ProductController::class, 'store']);
        $group->post('/produtos/lote', [ProductController::class, 'bulkUpdate']);
        $group->post('/produtos/lote/excluir', [ProductController::class, 'bulkDelete']);
        $group->get('/produtos/{id:[0-9]+}/editar', [ProductController::class, 'editForm']);
        $group->post('/produtos/{id:[0-9]+}', [ProductController::class, 'update']);
        $group->post('/produtos/{id:[0-9]+}/excluir', [ProductController::class, 'delete']);

        $group->get('/anuncios', [AnnouncementController::class, 'index']);
        $group->get('/anuncios/novo', [AnnouncementController::class, 'createForm']);
        $group->post('/anuncios', [AnnouncementController::class, 'store']);
        $group->get('/anuncios/{id:[0-9]+}/editar', [AnnouncementController::class, 'editForm']);
        $group->post('/anuncios/{id:[0-9]+}', [AnnouncementController::class, 'update']);
        $group->post('/anuncios/{id:[0-9]+}/excluir', [AnnouncementController::class, 'delete']);

        $group->get('/trocas', [TradeRequestController::class, 'index']);

        $group->get('/relatorios', [ReportsController::class, 'index']);
        $group->post('/relatorios/exportar', [ReportsController::class, 'export']);

        $group->get('/configuracoes', [SettingsController::class, 'index']);
        $group->get('/configuracoes/categorias', [SettingsController::class, 'categories']);
        $group->post('/configuracoes/categorias', [SettingsController::class, 'storeCategory']);
        $group->post('/configuracoes/categorias/{id:[0-9]+}', [SettingsController::class, 'updateCategory']);
        $group->post('/configuracoes/categorias/{id:[0-9]+}/excluir', [SettingsController::class, 'deleteCategory']);

        $group->get('/configuracoes/tags', [SettingsController::class, 'tags']);
        $group->post('/configuracoes/tags', [SettingsController::class, 'storeTag']);
        $group->post('/configuracoes/tags/{id:[0-9]+}', [SettingsController::class, 'updateTag']);
        $group->post('/configuracoes/tags/{id:[0-9]+}/excluir', [SettingsController::class, 'deleteTag']);

        $group->get('/configuracoes/variacoes', [SettingsController::class, 'variations']);
        $group->post('/configuracoes/variacoes', [SettingsController::class, 'storeVariationPreset']);
        $group->post('/configuracoes/variacoes/{id:[0-9]+}', [SettingsController::class, 'updateVariationPreset']);
        $group->post('/configuracoes/variacoes/{id:[0-9]+}/excluir', [SettingsController::class, 'deleteVariationPreset']);

        $group->get('/configuracoes/ctas', [SettingsController::class, 'ctas']);
        $group->post('/configuracoes/ctas', [SettingsController::class, 'updateCtas']);
        $group->post('/configuracoes/ctas/{slot:[1-2]}/ativo', [SettingsController::class, 'toggleCtaActive']);

        $group->get('/conta', [AccountController::class, 'form']);
        $group->post('/conta/senha', [AccountController::class, 'updatePassword']);
    })->add(new AuthMiddleware());
};
