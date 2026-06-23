<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Database;
use PDO;

final class FitcLedgerRepository
{
    public function __construct(private readonly Database $database)
    {
    }

    public function create(array $data): int
    {
        $stmt = $this->database->pdo()->prepare(
            'INSERT INTO fitc_ledger (employee_id, type, amount_fitc, balance_after_fitc, reference_type, reference_id, description, created_by_user_id)
             VALUES (:employee_id, :type, :amount_fitc, :balance_after_fitc, :reference_type, :reference_id, :description, :created_by_user_id)'
        );
        $stmt->execute($data);

        return (int) $this->database->pdo()->lastInsertId();
    }

    public function findByEmployeeId(int $employeeId, int $limit = 50): array
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT * FROM fitc_ledger WHERE employee_id = :employee_id ORDER BY created_at DESC LIMIT :limit'
        );
        $stmt->bindValue('employee_id', $employeeId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function countByEmployeeId(int $employeeId): int
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT COUNT(*) FROM fitc_ledger WHERE employee_id = :employee_id'
        );
        $stmt->execute(['employee_id' => $employeeId]);

        return (int) $stmt->fetchColumn();
    }
}
