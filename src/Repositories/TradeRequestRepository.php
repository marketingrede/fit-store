<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Database;
use PDO;

final class TradeRequestRepository
{
    public function __construct(private readonly Database $database)
    {
    }

    public function all(int $limit = 200): array
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT * FROM trade_requests ORDER BY created_at DESC LIMIT :limit'
        );
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function count(): int
    {
        return (int) $this->database->pdo()->query('SELECT COUNT(*) FROM trade_requests')->fetchColumn();
    }

    public function create(array $data): int
    {
        $stmt = $this->database->pdo()->prepare(
            'INSERT INTO trade_requests (name, email, product_id, product_name, product_price_fitc, product_selection_json)
             VALUES (:name, :email, :product_id, :product_name, :product_price_fitc, :product_selection_json)'
        );
        $stmt->execute($data);

        return (int) $this->database->pdo()->lastInsertId();
    }
}
