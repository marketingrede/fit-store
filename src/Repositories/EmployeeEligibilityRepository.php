<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Database;
use PDO;

final class EmployeeEligibilityRepository
{
    public function __construct(private readonly Database $database)
    {
    }

    public function findByEmployeeId(string $employeeId): ?array
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT * FROM employee_eligibility WHERE employee_id = :employee_id LIMIT 1'
        );
        $stmt->execute(['employee_id' => $employeeId]);

        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT * FROM employee_eligibility WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);

        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function all(): array
    {
        return $this->database->pdo()
            ->query('SELECT * FROM employee_eligibility ORDER BY employee_id ASC')
            ->fetchAll();
    }

    public function allActive(): array
    {
        return $this->database->pdo()
            ->query("SELECT * FROM employee_eligibility WHERE status = 'active' ORDER BY employee_id ASC")
            ->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->database->pdo()->prepare(
            'INSERT INTO employee_eligibility (employee_id, full_name, email, department, status, initial_balance_fitc, notes)
             VALUES (:employee_id, :full_name, :email, :department, :status, :initial_balance_fitc, :notes)'
        );
        $stmt->execute($data);

        return (int) $this->database->pdo()->lastInsertId();
    }

    public function update(int $id, array $data): void
    {
        $data['id'] = $id;
        $stmt = $this->database->pdo()->prepare(
            'UPDATE employee_eligibility SET
                full_name = :full_name,
                email = :email,
                department = :department,
                status = :status,
                initial_balance_fitc = :initial_balance_fitc,
                notes = :notes,
                updated_at = datetime(\'now\')
             WHERE id = :id'
        );
        $stmt->execute($data);
    }

    public function markRegistered(int $id): void
    {
        $stmt = $this->database->pdo()->prepare(
            'UPDATE employee_eligibility SET registered_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
    }

    public function delete(int $id): void
    {
        $this->database->pdo()->prepare('DELETE FROM employee_eligibility WHERE id = ?')->execute([$id]);
    }

    public function count(): int
    {
        return (int) $this->database->pdo()->query('SELECT COUNT(*) FROM employee_eligibility')->fetchColumn();
    }

    public function countActive(): int
    {
        return (int) $this->database->pdo()->query(
            "SELECT COUNT(*) FROM employee_eligibility WHERE status = 'active'"
        )->fetchColumn();
    }

    public function countRegistered(): int
    {
        return (int) $this->database->pdo()->query(
            'SELECT COUNT(*) FROM employee_eligibility WHERE registered_at IS NOT NULL'
        )->fetchColumn();
    }
}
