<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\ProductRepository;
use App\Repositories\ProductVariationRepository;
use App\Support\CatalogFilters;
use App\Support\CatalogPageSize;
use App\Support\CatalogConfig;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Views\Twig;

final class CatalogController
{
    public function __construct(
        private readonly Twig $view,
        private readonly ProductRepository $products,
        private readonly ProductVariationRepository $variations,
        private readonly CatalogConfig $catalog,
    ) {
    }

    public function products(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $filters = CatalogFilters::fromRequest($request, $this->catalog);
        $params = $request->getQueryParams();
        $page = max(1, (int) ($params['page'] ?? 1));

        $result = $this->products->allActiveFilteredPaginated(
            $filters['valid_categories'] ?: null,
            $filters['search'] !== '' ? $filters['search'] : null,
            $page,
            CatalogPageSize::PER_PAGE,
            $filters['valid_tags'] ?: null,
        );

        $products = $this->attachVariations($result['items']);

        $html = $this->view->getEnvironment()->render('public/partials/_catalog_grid_page.twig', [
            'products' => $products,
        ]);

        $payload = [
            'ok' => true,
            'html' => $html,
            'products' => $products,
            'page' => $result['page'],
            'has_more' => $result['has_more'],
            'total' => $result['total'],
        ];

        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE));

        return $response->withHeader('Content-Type', 'application/json');
    }

    /** @param list<array> $products */
    private function attachVariations(array $products): array
    {
        $ids = array_map(fn ($p) => (int) $p['id'], $products);
        $variationsByProduct = $this->variations->groupedByProductIds($ids);

        foreach ($products as &$product) {
            $product['variations'] = $variationsByProduct[(int) $product['id']] ?? [];
        }
        unset($product);

        return $products;
    }
}
