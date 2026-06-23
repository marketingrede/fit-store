<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Database;
use PDO;

final class FitcWalletRepository
{
    public function __construct(private readonly Database $database)
    {
    }

    public function findByEmployeeId(int $employeeId): ?array
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT * FROM fitc_wallets WHERE employee_id = :employee_id LIMIT 1'
        );
        $stmt->execute(['employee_id' => $employeeId]);

        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function getBalance(int $employeeId): int
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT balance_fitc FROM fitc_wallets WHERE employee_id = :employee_id'
        );
        $stmt->execute(['employee_id' => $employeeId]);

        $balance = $stmt->fetchColumn();

        return $balance !== false ? (int) $balance : 0;
    }

    public function create(int $employeeId, int $initialBalance = 0): void
    {
        $stmt = $this->database->pdo()->prepare(
            'INSERT INTO fitc_wallets (employee_id, balance_fitc) VALUES (:employee_id, :balance_fitc)'
        );
        $stmt->execute(['employee_id' => $employeeId, 'balance_fitc' => $initialBalance]);
    }

    public function debit(int $employeeId, int $amount): int
    {
        $stmt = $this->database->pdo()->prepare(
            'UPDATE fitc_wallets SET balance_fitc = balance_fitc - :amount, updated_at = datetime(\'now\')
             WHERE employee_id = :employee_id AND balance_fitc >= :amount'
        );
        $stmt->execute(['employee_id' => $employeeId, 'amount' => $amount]);

        $newBalance = $this->getBalance($employeeId);

        return $newBalance;
    }

    public function credit(int $employeeId, int $amount): int
    {
        $stmt = $this->database->pdo()->prepare(
            'UPDATE fitc_wallets SET balance_fitc = balance_fitc + :amount, updated_at = datetime(\'now\')
             WHERE employee_id = :employee_id'
        );
        $stmt->execute(['employee_id' => $employeeId, 'amount' => $amount]);

        $newBalance = $this->getBalance($employeeId);

        return $newBalance;
    }

    public function totalBalance(): int
    {
        return (int) $this->database->pdo()->query(
            'SELECT COALESCE(SUM(balance_fitc), 0) FROM fitc_wallets'
        )->fetchColumn();
    }
}
