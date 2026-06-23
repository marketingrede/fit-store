<?php

declare(strict_types=1);

use App\Controllers\EmployeeAuthController;
use App\Controllers\EmployeeController;
use App\Controllers\EmployeeTradeController;
use App\Middleware\EmployeeAuthMiddleware;
use Slim\App;

return function (App $app): void {
    $app->get('/colaborador/login', [EmployeeAuthController::class, 'loginForm']);
    $app->post('/colaborador/login', [EmployeeAuthController::class, 'login']);
    $app->post('/colaborador/logout', [EmployeeAuthController::class, 'logout']);

    $app->get('/colaborador/cadastro', [EmployeeAuthController::class, 'registerForm']);
    $app->post('/colaborador/registro', [EmployeeAuthController::class, 'register']);

    $app->group('/colaborador', function ($group) {
        $group->get('/', [EmployeeController::class, 'profile']);
        $group->get('/extrato', [EmployeeController::class, 'statement']);
        $group->get('/resgates', [EmployeeController::class, 'orders']);
        $group->get('/catalogo', [EmployeeTradeController::class, 'catalog']);
        $group->get('/api/catalogo', [EmployeeTradeController::class, 'catalogApi']);
    })->add(new EmployeeAuthMiddleware());

    $app->post('/api/colaborador/troca', [EmployeeTradeController::class, 'submit'])
        ->add(new EmployeeAuthMiddleware());
};
