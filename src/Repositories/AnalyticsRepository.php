<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Database;
use App\Support\CategoryLabels;
use PDO;

final class AnalyticsRepository
{
    public function __construct(private readonly Database $database)
    {
    }

    /** @return array<string, int|float> */
    public function summaryStats(): array
    {
        $pdo = $this->database->pdo();

        $productActive = (int) $pdo->query('SELECT COUNT(*) FROM products WHERE active = 1')->fetchColumn();
        $productTotal = (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
        $tradeTotal = (int) $pdo->query('SELECT COUNT(*) FROM trade_requests')->fetchColumn();
        $trades7d = (int) $pdo->query(
            "SELECT COUNT(*) FROM trade_requests WHERE created_at >= datetime('now', '-7 days')"
        )->fetchColumn();
        $trades30d = (int) $pdo->query(
            "SELECT COUNT(*) FROM trade_requests WHERE created_at >= datetime('now', '-30 days')"
        )->fetchColumn();
        $fitcTotal = (int) $pdo->query(
            'SELECT COALESCE(SUM(product_price_fitc), 0) FROM trade_requests'
        )->fetchColumn();
        $fitcAvg = $tradeTotal > 0 ? round($fitcTotal / $tradeTotal, 1) : 0.0;
        $productsWithImage = (int) $pdo->query(
            "SELECT COUNT(*) FROM products WHERE image_url IS NOT NULL AND image_url != ''"
        )->fetchColumn();

        $announcements = $pdo->query(
            "SELECT status, COUNT(*) AS count FROM announcements GROUP BY status"
        )->fetchAll(PDO::FETCH_KEY_PAIR);

        return [
            'product_active' => $productActive,
            'product_inactive' => $productTotal - $productActive,
            'product_total' => $productTotal,
            'trade_total' => $tradeTotal,
            'trades_7d' => $trades7d,
            'trades_30d' => $trades30d,
            'fitc_total' => $fitcTotal,
            'fitc_avg' => $fitcAvg,
            'announcements_published' => (int) ($announcements['published'] ?? 0),
            'announcements_draft' => (int) ($announcements['draft'] ?? 0),
            'categories_active' => (int) $pdo->query(
                'SELECT COUNT(*) FROM catalog_categories WHERE active = 1'
            )->fetchColumn(),
            'tags_active' => (int) $pdo->query(
                'SELECT COUNT(*) FROM catalog_tags WHERE active = 1'
            )->fetchColumn(),
            'products_with_image' => $productsWithImage,
        ];
    }

    /** @return list<array{day: string, count: int}> */
    public function tradesByDay(int $days = 30): array
    {
        $stmt = $this->database->pdo()->prepare(
            "SELECT date(created_at) AS day, COUNT(*) AS count
             FROM trade_requests
             WHERE created_at >= datetime('now', :offset)
             GROUP BY date(created_at)
             ORDER BY day ASC"
        );
        $stmt->execute(['offset' => '-' . max(1, $days) . ' days']);
        $rows = $stmt->fetchAll();

        $byDay = [];
        foreach ($rows as $row) {
            $byDay[(string) $row['day']] = (int) $row['count'];
        }

        $result = [];
        $start = new \DateTimeImmutable('today');
        $start = $start->sub(new \DateInterval('P' . max(1, $days - 1) . 'D'));

        for ($i = 0; $i < $days; $i++) {
            $day = $start->add(new \DateInterval('P' . $i . 'D'))->format('Y-m-d');
            $result[] = [
                'day' => $day,
                'count' => $byDay[$day] ?? 0,
            ];
        }

        return $result;
    }

    /** @return list<array{label: string, count: int}> */
    public function topProductsByTrades(int $limit = 8): array
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT product_name AS label, COUNT(*) AS count
             FROM trade_requests
             GROUP BY product_id, product_name
             ORDER BY count DESC, label ASC
             LIMIT :limit'
        );
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(
            fn (array $row) => [
                'label' => (string) $row['label'],
                'count' => (int) $row['count'],
            ],
            $stmt->fetchAll()
        );
    }

    /** @return list<array{label: string, count: int}> */
    public function productsByCategory(): array
    {
        $rows = $this->database->pdo()->query(
            'SELECT category, COUNT(*) AS count
             FROM products
             GROUP BY category
             ORDER BY count DESC, category ASC'
        )->fetchAll();

        return array_map(
            fn (array $row) => [
                'label' => CategoryLabels::label((string) $row['category']),
                'count' => (int) $row['count'],
            ],
            $rows
        );
    }

    /** @return list<array{label: string, count: int}> */
    public function productsByActiveStatus(): array
    {
        $rows = $this->database->pdo()->query(
            'SELECT active, COUNT(*) AS count FROM products GROUP BY active'
        )->fetchAll();

        return array_map(
            fn (array $row) => [
                'label' => (int) $row['active'] === 1 ? 'Ativos' : 'Inativos',
                'count' => (int) $row['count'],
            ],
            $rows
        );
    }

    /** @return list<array{label: string, count: int}> */
    public function announcementsByStatus(): array
    {
        $rows = $this->database->pdo()->query(
            'SELECT status, COUNT(*) AS count FROM announcements GROUP BY status'
        )->fetchAll();

        $labels = [
            'published' => 'Publicados',
            'draft' => 'Rascunhos',
        ];

        return array_map(
            fn (array $row) => [
                'label' => $labels[(string) $row['status']] ?? (string) $row['status'],
                'count' => (int) $row['count'],
            ],
            $rows
        );
    }

    /** @return list<array<string, mixed>> */
    public function reportTrades(?string $from = null, ?string $to = null): array
    {
        $sql = 'SELECT id, name, email, product_id, product_name, product_price_fitc,
                       product_selection_json, created_at
                FROM trade_requests
                WHERE 1=1';
        $params = [];

        if ($from !== null && $from !== '') {
            $sql .= ' AND date(created_at) >= :from';
            $params['from'] = $from;
        }
        if ($to !== null && $to !== '') {
            $sql .= ' AND date(created_at) <= :to';
            $params['to'] = $to;
        }

        $sql .= ' ORDER BY created_at DESC';

        $stmt = $this->database->pdo()->prepare($sql);
        $stmt->execute($params);

        return array_map(function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'nome' => (string) $row['name'],
                'email' => (string) $row['email'],
                'produto_id' => $row['product_id'] !== null ? (int) $row['product_id'] : '',
                'produto' => (string) $row['product_name'],
                'fitc' => $row['product_price_fitc'] !== null ? (int) $row['product_price_fitc'] : '',
                'variacoes' => (string) ($row['product_selection_json'] ?? ''),
                'criado_em' => (string) $row['created_at'],
            ];
        }, $stmt->fetchAll());
    }

    /** @return list<array<string, mixed>> */
    public function reportProducts(): array
    {
        $rows = $this->database->pdo()->query(
            'SELECT id, name, category, price_fitc, tag, active, image_url, created_at
             FROM products
             ORDER BY name ASC'
        )->fetchAll();

        return array_map(function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'nome' => (string) $row['name'],
                'categoria' => CategoryLabels::label((string) $row['category']),
                'categoria_slug' => (string) $row['category'],
                'fitc' => (int) $row['price_fitc'],
                'tag' => (string) ($row['tag'] ?? ''),
                'ativo' => (int) $row['active'] === 1 ? 'Sim' : 'Não',
                'tem_imagem' => !empty($row['image_url']) ? 'Sim' : 'Não',
                'criado_em' => (string) $row['created_at'],
            ];
        }, $rows);
    }

    /** @return list<array<string, mixed>> */
    public function reportAnnouncements(): array
    {
        $rows = $this->database->pdo()->query(
            'SELECT id, title, slug, status, published_at, created_at, updated_at
             FROM announcements
             ORDER BY created_at DESC'
        )->fetchAll();

        return array_map(function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'titulo' => (string) $row['title'],
                'slug' => (string) $row['slug'],
                'status' => (string) $row['status'],
                'publicado_em' => (string) ($row['published_at'] ?? ''),
                'criado_em' => (string) $row['created_at'],
                'atualizado_em' => (string) ($row['updated_at'] ?? ''),
            ];
        }, $rows);
    }

    /** @return list<array<string, mixed>> */
    public function reportCatalogSummary(): array
    {
        $stats = $this->summaryStats();
        $rows = [];

        foreach ($stats as $key => $value) {
            $rows[] = [
                'indicador' => $key,
                'valor' => $value,
            ];
        }

        foreach ($this->productsByCategory() as $item) {
            $rows[] = [
                'indicador' => 'produtos_categoria_' . $item['label'],
                'valor' => $item['count'],
            ];
        }

        foreach ($this->topProductsByTrades(20) as $item) {
            $rows[] = [
                'indicador' => 'trocas_produto_' . $item['label'],
                'valor' => $item['count'],
            ];
        }

        return $rows;
    }
}
