<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\FitcWalletRepository;
use App\Repositories\ProductRepository;
use App\Repositories\ProductVariationRepository;
use App\Services\TradeService;
use App\Support\Csrf;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Views\Twig;

final class EmployeeTradeController
{
    public function __construct(
        private readonly Twig $view,
        private readonly ProductRepository $productRepo,
        private readonly ProductVariationRepository $variationRepo,
        private readonly FitcWalletRepository $walletRepo,
        private readonly TradeService $tradeService,
    ) {
    }

    public function catalog(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $employeeId = $_SESSION['employee_id'] ?? 0;
        $balance = $this->walletRepo->getBalance($employeeId);

        $products = $this->productRepo->allActive();
        $affordableProducts = array_filter($products, function ($product) use ($balance) {
            return (int) $product['price_fitc'] <= $balance;
        });

        $variationIds = array_column($affordableProducts, 'id');
        $variations = $variationIds ? $this->variationRepo->groupedByProductIds($variationIds) : [];

        foreach ($affordableProducts as &$product) {
            $product['variations'] = $variations[(int) $product['id']] ?? [];
        }

        usort($affordableProducts, fn ($a, $b) => $a['price_fitc'] <=> $b['price_fitc']);

        return $this->view->render($response, 'employee/catalog.twig', [
            'balance' => $balance,
            'products' => array_values($affordableProducts),
            'total_products' => count($products),
            'affordable_count' => count($affordableProducts),
        ]);
    }

    public function catalogApi(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $employeeId = $_SESSION['employee_id'] ?? 0;
        $balance = $this->walletRepo->getBalance($employeeId);

        $params = $request->getQueryParams();
        $search = $params['q'] ?? null;
        $category = $params['categoria'] ?? null;

        $products = $this->productRepo->allActive($category, $search);

        $affordableProducts = array_filter($products, function ($product) use ($balance) {
            return (int) $product['price_fitc'] <= $balance;
        });

        $result = [];
        foreach ($affordableProducts as $product) {
            $result[] = [
                'id' => (int) $product['id'],
                'name' => $product['name'],
                'category' => $product['category'],
                'price_fitc' => (int) $product['price_fitc'],
                'image_url' => $product['image_url'],
            ];
        }

        $response->getBody()->write(json_encode([
            'products' => $result,
            'balance' => $balance,
            'count' => count($result),
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function submit(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody() ?? [];

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            $response->getBody()->write(json_encode(['ok' => false, 'error' => 'Sessão expirada.']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $employeeId = $_SESSION['employee_id'] ?? 0;
        $productId = (int) ($data['product_id'] ?? 0);
        $selectionJson = $data['product_selection'] ?? '{}';
        $selection = json_decode($selectionJson, true) ?? [];

        $result = $this->tradeService->processTrade($employeeId, $productId, $selection);

        $response->getBody()->write(json_encode($result));

        $status = $result['ok'] ? 200 : ($result['error'] === 'Saldo insuficiente.' ? 402 : 422);
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
