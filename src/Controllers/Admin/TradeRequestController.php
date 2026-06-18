<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Repositories\TradeRequestRepository;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Views\Twig;

final class TradeRequestController
{
    public function __construct(
        private readonly Twig $view,
        private readonly TradeRequestRepository $trades,
    ) {
    }

    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $trades = array_map(function (array $trade) {
            $trade['variation_summary'] = $this->formatVariationSummary($trade['product_selection_json'] ?? null);

            return $trade;
        }, $this->trades->all());

        return $this->view->render($response, 'admin/trades/index.twig', [
            'trades' => $trades,
            'active_nav' => 'trades',
        ]);
    }

    private function formatVariationSummary(?string $json): string
    {
        if (!$json) {
            return '';
        }

        $data = json_decode($json, true);
        if (!is_array($data)) {
            return '';
        }

        $choices = $data['choices'] ?? [];
        if (!is_array($choices) || $choices === []) {
            return '';
        }

        $parts = [];
        foreach ($choices as $row) {
            $attr = (string) ($row['attribute'] ?? '');
            $label = (string) ($row['label'] ?? '');
            if ($attr !== '' && $label !== '') {
                $parts[] = "{$attr}: {$label}";
            }
        }

        return implode(' · ', $parts);
    }
}
