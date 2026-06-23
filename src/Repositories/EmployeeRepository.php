<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Database;
use PDO;

final class EmployeeRepository
{
    public function __construct(private readonly Database $database)
    {
    }

    public function findByEmployeeId(string $employeeId): ?array
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT * FROM employees WHERE employee_id = :employee_id LIMIT 1'
        );
        $stmt->execute(['employee_id' => $employeeId]);

        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT * FROM employees WHERE email = :email LIMIT 1'
        );
        $stmt->execute(['email' => $email]);

        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT * FROM employees WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);

        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function all(): array
    {
        return $this->database->pdo()
            ->query('SELECT * FROM employees ORDER BY employee_id ASC')
            ->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->database->pdo()->prepare(
            'INSERT INTO employees (eligibility_id, employee_id, email, password_hash, full_name)
             VALUES (:eligibility_id, :employee_id, :email, :password_hash, :full_name)'
        );
        $stmt->execute($data);

        return (int) $this->database->pdo()->lastInsertId();
    }

    public function updateLastLogin(int $id): void
    {
        $stmt = $this->database->pdo()->prepare(
            'UPDATE employees SET last_login_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
    }

    public function updatePassword(int $id, string $passwordHash): void
    {
        $stmt = $this->database->pdo()->prepare(
            'UPDATE employees SET password_hash = :password_hash, updated_at = datetime(\'now\') WHERE id = :id'
        );
        $stmt->execute(['id' => $id, 'password_hash' => $passwordHash]);
    }

    public function delete(int $id): void
    {
        $this->database->pdo()->prepare('DELETE FROM employees WHERE id = ?')->execute([$id]);
    }

    public function count(): int
    {
        return (int) $this->database->pdo()->query('SELECT COUNT(*) FROM employees')->fetchColumn();
    }
}
