<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Database;
use PDO;

final class TradeOrderRepository
{
    public function __construct(private readonly Database $database)
    {
    }

    public function create(array $data): int
    {
        $stmt = $this->database->pdo()->prepare(
            'INSERT INTO trade_orders (employee_id, product_id, product_name, product_price_fitc, product_selection_json, status, ledger_debit_id)
             VALUES (:employee_id, :product_id, :product_name, :product_price_fitc, :product_selection_json, :status, :ledger_debit_id)'
        );
        $stmt->execute($data);

        return (int) $this->database->pdo()->lastInsertId();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT * FROM trade_orders WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);

        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function findByEmployeeId(int $employeeId, int $limit = 50): array
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT * FROM trade_orders WHERE employee_id = :employee_id ORDER BY created_at DESC LIMIT :limit'
        );
        $stmt->bindValue('employee_id', $employeeId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function countByEmployeeId(int $employeeId): int
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT COUNT(*) FROM trade_orders WHERE employee_id = :employee_id'
        );
        $stmt->execute(['employee_id' => $employeeId]);

        return (int) $stmt->fetchColumn();
    }

    public function all(int $limit = 200): array
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT * FROM trade_orders ORDER BY created_at DESC LIMIT :limit'
        );
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function count(): int
    {
        return (int) $this->database->pdo()->query('SELECT COUNT(*) FROM trade_orders')->fetchColumn();
    }

    public function updateStatus(int $id, string $status, ?string $notes = null): void
    {
        $stmt = $this->database->pdo()->prepare(
            'UPDATE trade_orders SET status = :status, fulfillment_notes = :notes, updated_at = datetime(\'now\')
             WHERE id = :id'
        );
        $stmt->execute(['id' => $id, 'status' => $status, 'notes' => $notes]);
    }
}
