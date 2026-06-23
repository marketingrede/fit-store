<?php

declare(strict_types=1);

use DI\Container;
use Slim\Factory\AppFactory;
use Slim\Views\Twig;
use Slim\Views\TwigMiddleware;
use App\Database\Database;
use App\Support\CatalogConfig;
use App\Middleware\SessionMiddleware;
use Dotenv\Dotenv;

require __DIR__ . '/../vendor/autoload.php';

$root = dirname(__DIR__);

if (file_exists($root . '/.env')) {
    Dotenv::createImmutable($root)->safeLoad();
}

$container = new Container();
AppFactory::setContainer($container);
$app = AppFactory::create();
$app->setBasePath('');

$twig = Twig::create($root . '/templates', [
    'cache' => ($_ENV['APP_ENV'] ?? 'production') === 'production'
        ? $root . '/var/cache/twig'
        : false,
    'auto_reload' => ($_ENV['APP_DEBUG'] ?? 'false') === 'true',
]);

$twig->getEnvironment()->addGlobal('app_name', 'Fit Store');
$twig->getEnvironment()->addGlobal('app_url', rtrim($_ENV['APP_URL'] ?? '', '/'));
$twig->getEnvironment()->addExtension(new App\Twig\AppExtension());

$container->set(Twig::class, $twig);
$container->set(Database::class, fn () => new Database($root));
$container->set(App\Repositories\CategoryRepository::class, fn ($c) => new App\Repositories\CategoryRepository($c->get(Database::class)));
$container->set(App\Repositories\TagRepository::class, fn ($c) => new App\Repositories\TagRepository($c->get(Database::class)));
$container->set(App\Repositories\VariationPresetRepository::class, fn ($c) => new App\Repositories\VariationPresetRepository($c->get(Database::class)));
$container->set(CatalogConfig::class, fn ($c) => new CatalogConfig(
    $c->get(App\Repositories\CategoryRepository::class),
    $c->get(App\Repositories\TagRepository::class),
    $c->get(App\Repositories\VariationPresetRepository::class),
));
$container->set(App\Repositories\ProductRepository::class, fn ($c) => new App\Repositories\ProductRepository($c->get(Database::class)));
$container->set(App\Repositories\CatalogCtaCardRepository::class, fn ($c) => new App\Repositories\CatalogCtaCardRepository($c->get(Database::class)));
$container->set(App\Repositories\AnnouncementRepository::class, fn ($c) => new App\Repositories\AnnouncementRepository($c->get(Database::class)));
$container->set(App\Repositories\ProductVariationRepository::class, fn ($c) => new App\Repositories\ProductVariationRepository($c->get(Database::class)));
$container->set(App\Repositories\TradeRequestRepository::class, fn ($c) => new App\Repositories\TradeRequestRepository($c->get(Database::class)));
$container->set(App\Repositories\AnalyticsRepository::class, fn ($c) => new App\Repositories\AnalyticsRepository($c->get(Database::class)));
$container->set(App\Repositories\EmployeeEligibilityRepository::class, fn ($c) => new App\Repositories\EmployeeEligibilityRepository($c->get(Database::class)));
$container->set(App\Repositories\EmployeeRepository::class, fn ($c) => new App\Repositories\EmployeeRepository($c->get(Database::class)));
$container->set(App\Repositories\FitcWalletRepository::class, fn ($c) => new App\Repositories\FitcWalletRepository($c->get(Database::class)));
$container->set(App\Repositories\FitcLedgerRepository::class, fn ($c) => new App\Repositories\FitcLedgerRepository($c->get(Database::class)));
$container->set(App\Repositories\TradeOrderRepository::class, fn ($c) => new App\Repositories\TradeOrderRepository($c->get(Database::class)));
$container->set(App\Services\ReportExporter::class, fn () => new App\Services\ReportExporter());
$container->set(App\Services\UploadService::class, fn () => new App\Services\UploadService($root));
$container->set(App\Services\HtmlSanitizer::class, fn () => new App\Services\HtmlSanitizer());
$container->set(App\Services\TradeService::class, fn ($c) => new App\Services\TradeService(
    $c->get(App\Repositories\ProductRepository::class),
    $c->get(App\Repositories\ProductVariationRepository::class),
    $c->get(App\Repositories\FitcWalletRepository::class),
    $c->get(App\Repositories\FitcLedgerRepository::class),
    $c->get(App\Repositories\TradeOrderRepository::class),
));

$app->add(TwigMiddleware::create($app, $twig));
$app->add(new SessionMiddleware($_ENV['SESSION_SECRET'] ?? 'dev-secret-change-me'));
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();

$container->set(App\Controllers\HomeController::class, fn ($c) => new App\Controllers\HomeController(
    $c->get(Twig::class),
    $c->get(App\Repositories\ProductRepository::class),
    $c->get(App\Repositories\ProductVariationRepository::class),
    $c->get(App\Repositories\AnnouncementRepository::class),
    $c->get(CatalogConfig::class),
    $c->get(App\Repositories\CatalogCtaCardRepository::class),
));
$container->set(App\Controllers\ProductController::class, fn ($c) => new App\Controllers\ProductController(
    $c->get(Twig::class),
    $c->get(App\Repositories\ProductRepository::class),
    $c->get(App\Controllers\HomeController::class),
));
$container->set(App\Controllers\TradeController::class, fn ($c) => new App\Controllers\TradeController(
    $c->get(App\Repositories\TradeRequestRepository::class),
    $c->get(App\Repositories\ProductRepository::class),
    $c->get(App\Repositories\ProductVariationRepository::class),
));
$container->set(App\Controllers\AnnouncementController::class, fn ($c) => new App\Controllers\AnnouncementController(
    $c->get(App\Repositories\AnnouncementRepository::class),
));
$container->set(App\Controllers\CatalogController::class, fn ($c) => new App\Controllers\CatalogController(
    $c->get(Twig::class),
    $c->get(App\Repositories\ProductRepository::class),
    $c->get(App\Repositories\ProductVariationRepository::class),
    $c->get(CatalogConfig::class),
));
$container->set(App\Controllers\Admin\AuthController::class, fn ($c) => new App\Controllers\Admin\AuthController(
    $c->get(Twig::class),
    $c->get(Database::class),
));
$container->set(App\Controllers\Admin\DashboardController::class, fn ($c) => new App\Controllers\Admin\DashboardController(
    $c->get(Twig::class),
    $c->get(App\Repositories\AnalyticsRepository::class),
    $c->get(App\Repositories\TradeRequestRepository::class),
));
$container->set(App\Controllers\Admin\AnnouncementController::class, fn ($c) => new App\Controllers\Admin\AnnouncementController(
    $c->get(Twig::class),
    $c->get(App\Repositories\AnnouncementRepository::class),
    $c->get(App\Services\UploadService::class),
    $c->get(App\Services\HtmlSanitizer::class),
));
$container->set(App\Controllers\Admin\ProductController::class, fn ($c) => new App\Controllers\Admin\ProductController(
    $c->get(Twig::class),
    $c->get(App\Repositories\ProductRepository::class),
    $c->get(App\Repositories\ProductVariationRepository::class),
    $c->get(App\Services\UploadService::class),
    $c->get(CatalogConfig::class),
));
$container->set(App\Controllers\Admin\SettingsController::class, fn ($c) => new App\Controllers\Admin\SettingsController(
    $c->get(Twig::class),
    $c->get(App\Repositories\CategoryRepository::class),
    $c->get(App\Repositories\TagRepository::class),
    $c->get(App\Repositories\VariationPresetRepository::class),
    $c->get(App\Repositories\CatalogCtaCardRepository::class),
    $c->get(App\Services\UploadService::class),
));
$container->set(App\Controllers\Admin\TradeRequestController::class, fn ($c) => new App\Controllers\Admin\TradeRequestController(
    $c->get(Twig::class),
    $c->get(App\Repositories\TradeRequestRepository::class),
));
$container->set(App\Controllers\Admin\ReportsController::class, fn ($c) => new App\Controllers\Admin\ReportsController(
    $c->get(Twig::class),
    $c->get(App\Repositories\AnalyticsRepository::class),
    $c->get(App\Services\ReportExporter::class),
));
$container->set(App\Controllers\Admin\AccountController::class, fn ($c) => new App\Controllers\Admin\AccountController(
    $c->get(Twig::class),
    $c->get(Database::class),
));

$container->set(App\Controllers\EmployeeAuthController::class, fn ($c) => new App\Controllers\EmployeeAuthController(
    $c->get(Twig::class),
    $c->get(App\Repositories\EmployeeEligibilityRepository::class),
    $c->get(App\Repositories\EmployeeRepository::class),
    $c->get(App\Repositories\FitcWalletRepository::class),
    $c->get(App\Repositories\FitcLedgerRepository::class),
));
$container->set(App\Controllers\EmployeeController::class, fn ($c) => new App\Controllers\EmployeeController(
    $c->get(Twig::class),
    $c->get(App\Repositories\EmployeeRepository::class),
    $c->get(App\Repositories\FitcWalletRepository::class),
    $c->get(App\Repositories\FitcLedgerRepository::class),
    $c->get(App\Repositories\TradeOrderRepository::class),
));
$container->set(App\Controllers\EmployeeTradeController::class, fn ($c) => new App\Controllers\EmployeeTradeController(
    $c->get(Twig::class),
    $c->get(App\Repositories\ProductRepository::class),
    $c->get(App\Repositories\ProductVariationRepository::class),
    $c->get(App\Repositories\FitcWalletRepository::class),
    $c->get(App\Services\TradeService::class),
));

$database = $container->get(Database::class);
$database->migrate();
$database->seedIfEmpty();

$catalogConfig = $container->get(CatalogConfig::class);
$twig->getEnvironment()->addGlobal('categories', $catalogConfig->categoryMap());
$twig->getEnvironment()->addGlobal('catalog_tags', $catalogConfig->activeTags());

(require $root . '/routes/web.php')($app);
(require $root . '/routes/admin.php')($app);
(require $root . '/routes/employee.php')($app);

$displayErrors = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';
$app->addErrorMiddleware($displayErrors, $displayErrors, $displayErrors);

return $app;
