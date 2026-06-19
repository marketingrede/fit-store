<?php

declare(strict_types=1);

namespace App\Database;

use Libsql\Connection;
use PDO;

/**
 * Subconjunto de PDO usado pelos repositórios, sobre libSQL/Turso.
 */
final class LibsqlPdo
{
    public function __construct(private readonly Connection $connection)
    {
    }

    public function prepare(string $sql): LibsqlPdoStatement
    {
        return new LibsqlPdoStatement($this->connection, $sql);
    }

    public function query(string $sql): LibsqlPdoStatement
    {
        $statement = $this->prepare($sql);
        $statement->execute();

        return $statement;
    }

    public function exec(string $sql): int|false
    {
        $this->connection->executeBatch($sql);

        return 0;
    }

    public function lastInsertId(?string $name = null): string|false
    {
        return (string) $this->connection->lastInsertId();
    }
}
