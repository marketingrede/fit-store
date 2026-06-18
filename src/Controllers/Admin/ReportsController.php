<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Repositories\AnalyticsRepository;
use App\Services\ReportExporter;
use App\Support\Csrf;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Views\Twig;

final class ReportsController
{
    private const DATASETS = [
        'trades' => [
            'label' => 'Solicitações de troca',
            'description' => 'Histórico completo de resgates na loja.',
            'fields' => 'Nome, e-mail, produto, FITC, variações e data',
            'supports_dates' => true,
            'icon' => 'arrow-left-right',
            'icon_tone' => 'blue',
        ],
        'products' => [
            'label' => 'Produtos do catálogo',
            'description' => 'Inventário com categoria, preço e status.',
            'fields' => 'Nome, categoria, FITC, tag, ativo e imagem',
            'supports_dates' => false,
            'icon' => 'package',
            'icon_tone' => 'teal',
        ],
        'announcements' => [
            'label' => 'Anúncios',
            'description' => 'Conteúdo publicado e rascunhos do site.',
            'fields' => 'Título, slug, status e datas',
            'supports_dates' => false,
            'icon' => 'megaphone',
            'icon_tone' => 'blue',
        ],
        'catalog_summary' => [
            'label' => 'Resumo da plataforma',
            'description' => 'Indicadores agregados para análises rápidas.',
            'fields' => 'Indicadores, totais e rankings',
            'supports_dates' => false,
            'icon' => 'bar-chart-3',
            'icon_tone' => 'teal',
        ],
    ];

    public function __construct(
        private readonly Twig $view,
        private readonly AnalyticsRepository $analytics,
        private readonly ReportExporter $exporter,
    ) {
    }

    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $stats = $this->analytics->summaryStats();

        return $this->view->render($response, 'admin/reports/index.twig', [
            'active_nav' => 'reports',
            'datasets' => self::DATASETS,
            'flash' => $this->pullFlash(),
            'preview_counts' => [
                'trades' => $stats['trade_total'],
                'products' => $stats['product_total'],
                'announcements' => $stats['announcements_published'] + $stats['announcements_draft'],
                'catalog_summary' => count($this->analytics->reportCatalogSummary()),
            ],
        ]);
    }

    public function export(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = (array) $request->getParsedBody();
        $query = $request->getQueryParams();

        if (!Csrf::validate($data['_csrf'] ?? $query['_csrf'] ?? null)) {
            return $response->withStatus(419);
        }

        $dataset = (string) ($data['dataset'] ?? $query['dataset'] ?? '');
        $format = (string) ($data['format'] ?? $query['format'] ?? 'csv');

        if (!isset(self::DATASETS[$dataset])) {
            return $response->withStatus(400);
        }

        if (!in_array($format, ['csv', 'ods', 'json'], true)) {
            return $response->withStatus(400);
        }

        $from = trim((string) ($data['from'] ?? $query['from'] ?? ''));
        $to = trim((string) ($data['to'] ?? $query['to'] ?? ''));

        try {
            [$headers, $rows] = $this->resolveDataset($dataset, $from ?: null, $to ?: null);
            $basename = sprintf(
                'movimenta-%s-%s',
                $dataset,
                (new \DateTimeImmutable('now'))->format('Y-m-d')
            );

            return $this->exporter->toResponse($response, $format, $basename, $headers, $rows);
        } catch (\Throwable $e) {
            $_SESSION['flash'] = ['type' => 'error', 'message' => $e->getMessage()];

            return $response
                ->withHeader('Location', '/admin/relatorios')
                ->withStatus(302);
        }
    }

    /** @return array{0: list<string>, 1: list<array<string, mixed>>} */
    private function resolveDataset(string $dataset, ?string $from, ?string $to): array
    {
        $rows = match ($dataset) {
            'trades' => $this->analytics->reportTrades($from, $to),
            'products' => $this->analytics->reportProducts(),
            'announcements' => $this->analytics->reportAnnouncements(),
            'catalog_summary' => $this->analytics->reportCatalogSummary(),
            default => [],
        };

        if ($rows === []) {
            return [$this->headersFor($dataset), []];
        }

        $headers = array_keys($rows[0]);

        return [$headers, $rows];
    }

    /** @return list<string> */
    private function headersFor(string $dataset): array
    {
        return match ($dataset) {
            'trades' => ['id', 'nome', 'email', 'produto_id', 'produto', 'fitc', 'variacoes', 'criado_em'],
            'products' => ['id', 'nome', 'categoria', 'categoria_slug', 'fitc', 'tag', 'ativo', 'tem_imagem', 'criado_em'],
            'announcements' => ['id', 'titulo', 'slug', 'status', 'publicado_em', 'criado_em', 'atualizado_em'],
            'catalog_summary' => ['indicador', 'valor'],
            default => [],
        };
    }

    /** @return array{type: string, message: string}|null */
    private function pullFlash(): ?array
    {
        $flash = $_SESSION['flash'] ?? null;
        unset($_SESSION['flash']);

        return $flash;
    }
}
