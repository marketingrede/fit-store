<?php

declare(strict_types=1);

use Libsql\Database;

require __DIR__ . '/../vendor/autoload.php';

$url = getenv('TURSO_DATABASE_URL') ?: ($_ENV['TURSO_DATABASE_URL'] ?? '');
$token = getenv('TURSO_AUTH_TOKEN') ?: ($_ENV['TURSO_AUTH_TOKEN'] ?? '');
$sqlFile = $argv[1] ?? __DIR__ . '/../data/fit-store-import.sql';

if ($url === '' || $token === '') {
    fwrite(STDERR, "Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN.\n");
    exit(1);
}

if (!is_file($sqlFile)) {
    fwrite(STDERR, "Arquivo SQL não encontrado: {$sqlFile}\n");
    exit(1);
}

$sql = file_get_contents($sqlFile);
if ($sql === false || trim($sql) === '') {
    fwrite(STDERR, "Dump SQL vazio.\n");
    exit(1);
}

$db = new Database(url: $url, authToken: $token);
$conn = $db->connect();

$statements = splitSqlDump($sql);
$applied = 0;

foreach ($statements as $statement) {
    $trimmed = trim($statement);
    if ($trimmed === '') {
        continue;
    }

    $trimmed = normalizeUnistr($trimmed);

    if (shouldSkipStatement($trimmed)) {
        continue;
    }

    if (stripos($trimmed, 'sqlite_sequence') !== false) {
        continue;
    }

    try {
        if (isReadQuery($trimmed)) {
            $conn->query($trimmed);
        } else {
            $conn->execute($trimmed);
        }
        $applied++;
    } catch (Throwable $e) {
        fwrite(STDERR, "Falha em: " . substr($trimmed, 0, 120) . "...\n");
        fwrite(STDERR, $e->getMessage() . "\n");
        exit(1);
    }
}

$count = $conn->query('SELECT COUNT(*) AS c FROM products')->fetchArray()[0]['c'] ?? 0;
echo "Import concluído ({$applied} statements). Produtos no Turso: {$count}\n";

/**
 * @return list<string>
 */
function splitSqlDump(string $sql): array
{
    $parts = preg_split('/;\s*\n/', $sql) ?: [];

    return array_map(static fn (string $part): string => trim($part), $parts);
}

function shouldSkipStatement(string $sql): bool
{
    return (bool) preg_match(
        '/^(PRAGMA|BEGIN(\s+TRANSACTION)?|COMMIT|ROLLBACK|SAVEPOINT|RELEASE|END)\b/i',
        $sql
    );
}

function normalizeUnistr(string $sql): string
{
    return preg_replace_callback(
        "/unistr\\('((?:[^'\\\\]|\\\\.)*)'\\)/i",
        static function (array $matches): string {
            $value = $matches[1];
            $value = preg_replace_callback(
                '/\\\\u([0-9a-fA-F]{4})/',
                static fn (array $unicode): string => mb_chr((int) hexdec($unicode[1]), 'UTF-8'),
                $value
            ) ?? $value;
            $value = str_replace(['\\n', '\\r', '\\t', "''"], ["\n", "\r", "\t", "'"], $value);
            $value = str_replace("'", "''", $value);

            return "'" . $value . "'";
        },
        $sql
    ) ?? $sql;
}

function isReadQuery(string $sql): bool
{
    return (bool) preg_match('/^(SELECT|WITH|EXPLAIN|PRAGMA)\b/i', ltrim($sql));
}
