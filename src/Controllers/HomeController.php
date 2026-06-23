<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\AnnouncementRepository;
use App\Repositories\CatalogCtaCardRepository;
use App\Repositories\ProductRepository;
use App\Repositories\ProductVariationRepository;
use App\Support\CatalogConfig;
use App\Support\CatalogFilters;
use App\Support\CatalogPageSize;
use App\Support\CatalogUrl;
use App\Support\Spa;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Views\Twig;

final class HomeController
{
    public function __construct(
        private readonly Twig $view,
        private readonly ProductRepository $products,
        private readonly ProductVariationRepository $variations,
        private readonly AnnouncementRepository $announcements,
        private readonly CatalogConfig $catalog,
        private readonly CatalogCtaCardRepository $ctaCards,
    ) {
    }

    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $this->buildPageData($request);

        if (Spa::isPartial($request)) {
            return $this->view->render($response, 'public/partials/home.twig', $data)
                ->withHeader('X-Page-Title', 'Fit Store — A Loja do Movimenta+')
                ->withHeader('X-Page-Type', 'home');
        }

        return $this->view->render($response, 'public/home.twig', $data);
    }

    /** @return array<string, mixed> */
    public function buildPageData(ServerRequestInterface $request): array
    {
        $filters = CatalogFilters::fromRequest($request, $this->catalog);
        $search = $filters['search'];
        $validCategories = $filters['valid_categories'];
        $validTags = $filters['valid_tags'];
        $priceMin = $filters['price_min'];
        $priceMax = $filters['price_max'];

        $catalogResult = $this->products->allActiveFilteredPaginated(
            $validCategories ?: null,
            $search !== '' ? $search : null,
            1,
            CatalogPageSize::PER_PAGE,
            $validTags ?: null,
            $priceMin ?: null,
            $priceMax ?: null,
        );

        $products = $this->attachVariations($catalogResult['items']);

        $categoryMap = $this->catalog->categoryMap();
        $tagList = $this->catalog->activeTags();
        $toggleUrls = [];
        $removeUrls = [];
        foreach (array_keys($categoryMap) as $slug) {
            $toggleUrls[$slug] = CatalogUrl::toggleCategory($search, $validCategories, $slug, $validTags, $priceMin, $priceMax);
            $removeUrls[$slug] = CatalogUrl::removeCategory($search, $validCategories, $slug, $validTags, $priceMin, $priceMax);
        }

        $toggleTagUrls = [];
        $removeTagUrls = [];
        foreach ($tagList as $tag) {
            $name = (string) ($tag['name'] ?? '');
            if ($name === '') {
                continue;
            }
            $toggleTagUrls[$name] = CatalogUrl::toggleTag($search, $validCategories, $validTags, $name, $priceMin, $priceMax);
            $removeTagUrls[$name] = CatalogUrl::removeTag($search, $validCategories, $validTags, $name, $priceMin, $priceMax);
        }

        $allPrices = $this->products->allActive();
        $minProductPrice = 0;
        $maxProductPrice = 0;
        if ($allPrices !== []) {
            $prices = array_column($allPrices, 'price_fitc');
            $minProductPrice = min($prices);
            $maxProductPrice = max($prices);
        }

        $hasPriceFilter = $priceMin > 0 || $priceMax > 0;

        return [
            'products' => $products,
            'catalog_cta_cards' => $this->ctaCards->activeBySlot(),
            'catalog_total' => $catalogResult['total'],
            'catalog_has_more' => $catalogResult['has_more'],
            'catalog_page' => $catalogResult['page'],
            'categories' => $categoryMap,
            'tags' => $tagList,
            'activeCategories' => $validCategories,
            'activeTags' => $validTags,
            'search' => $search,
            'header_search' => $search,
            'price_min' => $priceMin,
            'price_max' => $priceMax,
            'min_product_price' => $minProductPrice,
            'max_product_price' => $maxProductPrice,
            'has_price_filter' => $hasPriceFilter,
            'catalog_urls' => [
                'all' => CatalogUrl::build($search),
                'clear' => CatalogUrl::build($search, []),
                'clear_categories' => CatalogUrl::build($search, [], $validTags),
                'clear_tags' => CatalogUrl::build($search, $validCategories),
                'toggle' => $toggleUrls,
                'remove' => $removeUrls,
                'toggle_tag' => $toggleTagUrls,
                'remove_tag' => $removeTagUrls,
            ],
        ];
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
