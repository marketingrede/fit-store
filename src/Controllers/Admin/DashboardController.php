<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Repositories\AnalyticsRepository;
use App\Repositories\TradeRequestRepository;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Views\Twig;

final class DashboardController
{
    public function __construct(
        private readonly Twig $view,
        private readonly AnalyticsRepository $analytics,
        private readonly TradeRequestRepository $trades,
    ) {
    }

    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $stats = $this->analytics->summaryStats();
        $timeline = $this->analytics->tradesByDay(30);

        $chartData = [
            'trades_timeline' => [
                'labels' => array_map(
                    static fn (array $row) => (new \DateTimeImmutable($row['day']))->format('d/m'),
                    $timeline
                ),
                'values' => array_column($timeline, 'count'),
            ],
            'top_products' => $this->analytics->topProductsByTrades(8),
            'products_by_category' => $this->analytics->productsByCategory(),
            'products_by_status' => $this->analytics->productsByActiveStatus(),
            'announcements_by_status' => $this->analytics->announcementsByStatus(),
        ];

        return $this->view->render($response, 'admin/dashboard.twig', [
            'stats' => $stats,
            'chart_data' => $chartData,
            'recentTrades' => array_slice($this->trades->all(8), 0, 8),
            'active_nav' => 'dashboard',
        ]);
    }
}
