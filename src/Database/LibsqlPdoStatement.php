<?php

declare(strict_types=1);

namespace App\Database;

use Libsql\Connection;
use Libsql\Rows;
use PDO;

/**
 * Subconjunto de PDOStatement usado pelos repositórios, sobre libSQL/Turso.
 */
final class LibsqlPdoStatement
{
    /** @var array<int|string, mixed> */
    private array $bindings = [];

    private ?Rows $rows = null;

    /** @var array<int, array<string, mixed>>|null */
    private ?array $bufferedRows = null;

    private int $bufferIndex = 0;

    public function __construct(
        private readonly Connection $connection,
        private readonly string $sql,
    ) {
    }

    public function bindValue(int|string $param, mixed $value, int $type = PDO::PARAM_STR): bool
    {
        if ($type === PDO::PARAM_INT) {
            $value = (int) $value;
        } elseif ($type === PDO::PARAM_BOOL) {
            $value = $value ? 1 : 0;
        } elseif ($value !== null) {
            $value = (string) $value;
        }

        $this->bindings[$this->normalizeParamKey($param)] = $value;

        return true;
    }

    /**
     * @param array<int|string, mixed>|null $params
     */
    public function execute(?array $params = null): bool
    {
        $merged = $this->bindings;
        if ($params !== null) {
            foreach ($params as $key => $value) {
                $merged[$this->normalizeParamKey($key)] = $value;
            }
        }
        $this->bindings = [];

        $statement = $this->connection->prepare($this->sql);
        if ($merged !== []) {
            $statement = $statement->bind($merged);
        }

        if ($this->isReadQuery($this->sql)) {
            $this->rows = $statement->query();
        } else {
            $statement->execute();
            $this->rows = null;
        }

        $this->bufferedRows = null;
        $this->bufferIndex = 0;

        return true;
    }

    /**
     * @return array<int|string, mixed>|false
     */
    public function fetch(int $mode = PDO::FETCH_ASSOC): array|false
    {
        $this->bufferRows();

        if ($this->bufferedRows === null || !isset($this->bufferedRows[$this->bufferIndex])) {
            return false;
        }

        $row = $this->bufferedRows[$this->bufferIndex];
        $this->bufferIndex++;

        if ($mode === PDO::FETCH_KEY_PAIR) {
            $values = array_values($row);

            return [$values[0] ?? null => $values[1] ?? null];
        }

        return $row;
    }

    /**
     * @return array<int|string, mixed>
     */
    public function fetchAll(int $mode = PDO::FETCH_ASSOC): array
    {
        $this->bufferRows();
        $rows = $this->bufferedRows ?? [];
        $this->bufferedRows = [];
        $this->bufferIndex = 0;
        $this->rows = null;

        if ($mode === PDO::FETCH_KEY_PAIR) {
            $pairs = [];
            foreach ($rows as $row) {
                $values = array_values($row);
                if ($values === []) {
                    continue;
                }
                $pairs[$values[0]] = $values[1] ?? null;
            }

            return $pairs;
        }

        return $rows;
    }

    public function fetchColumn(int $column = 0): mixed
    {
        $this->bufferRows();

        if ($this->bufferedRows === null || !isset($this->bufferedRows[$this->bufferIndex])) {
            return false;
        }

        $row = $this->bufferedRows[$this->bufferIndex];
        $this->bufferIndex++;

        $values = array_values($row);

        return $values[$column] ?? false;
    }

    private function bufferRows(): void
    {
        if ($this->bufferedRows !== null || $this->rows === null) {
            return;
        }

        $this->bufferedRows = $this->rows->fetchArray();
        $this->bufferIndex = 0;
        $this->rows = null;
    }

    private function isReadQuery(string $sql): bool
    {
        $normalized = ltrim($sql);

        return (bool) preg_match('/^(SELECT|WITH|PRAGMA|EXPLAIN)\b/i', $normalized);
    }

    private function normalizeParamKey(int|string $key): int|string
    {
        if (is_string($key) && $key !== '' && !str_starts_with($key, ':')) {
            return ':' . $key;
        }

        return $key;
    }
}
