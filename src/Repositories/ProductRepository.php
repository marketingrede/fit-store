<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Database;
use App\Support\ProductListSort;
use PDO;

final class ProductRepository
{
    public function __construct(private readonly Database $database)
    {
    }

    public function allActive(?string $category = null, ?string $search = null): array
    {
        $categories = null;
        if ($category && $category !== 'all') {
            $categories = [$category];
        }

        return $this->allActiveFiltered($categories, $search);
    }

    public function allActiveFiltered(?array $categories, ?string $search = null): array
    {
        $sql = 'SELECT * FROM products WHERE active = 1';
        $params = [];

        if ($categories && count($categories) > 0) {
            $placeholders = [];
            foreach (array_values($categories) as $i => $cat) {
                $key = 'cat' . $i;
                $placeholders[] = ':' . $key;
                $params[$key] = $cat;
            }
            $sql .= ' AND category IN (' . implode(', ', $placeholders) . ')';
        }

        if ($search) {
            $sql .= ' AND name LIKE :search';
            $params['search'] = '%' . $search . '%';
        }

        $sql .= ' ORDER BY name ASC';

        $stmt = $this->database->pdo()->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    /**
     * @return array{items: list<array>, total: int, page: int, per_page: int, has_more: bool}
     */
    public function allActiveFilteredPaginated(
        ?array $categories,
        ?string $search,
        int $page,
        int $perPage,
        ?array $tags = null,
        ?int $priceMin = null,
        ?int $priceMax = null,
    ): array {
        $where = ['active = 1'];
        $params = [];

        $filterGroups = [];

        if ($categories && count($categories) > 0) {
            $placeholders = [];
            foreach (array_values($categories) as $i => $cat) {
                $key = 'cat' . $i;
                $placeholders[] = ':' . $key;
                $params[$key] = $cat;
            }
            $filterGroups[] = 'category IN (' . implode(', ', $placeholders) . ')';
        }

        if ($tags && count($tags) > 0) {
            $placeholders = [];
            foreach (array_values($tags) as $i => $tag) {
                $key = 'tag' . $i;
                $placeholders[] = ':' . $key;
                $params[$key] = $tag;
            }
            $filterGroups[] = 'tag IN (' . implode(', ', $placeholders) . ')';
        }

        if ($filterGroups !== []) {
            $where[] = '(' . implode(' OR ', $filterGroups) . ')';
        }

        if ($search) {
            $where[] = 'name LIKE :search';
            $params['search'] = '%' . $search . '%';
        }

        if ($priceMin !== null && $priceMin > 0) {
            $where[] = 'price_fitc >= :price_min';
            $params['price_min'] = $priceMin;
        }

        if ($priceMax !== null && $priceMax > 0) {
            $where[] = 'price_fitc <= :price_max';
            $params['price_max'] = $priceMax;
        }

        $whereSql = implode(' AND ', $where);

        $countStmt = $this->database->pdo()->prepare(
            "SELECT COUNT(*) FROM products WHERE {$whereSql}"
        );
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $page = max(1, $page);
        $totalPages = max(1, (int) ceil($total / $perPage));
        if ($page > $totalPages) {
            $page = $totalPages;
        }
        $offset = ($page - 1) * $perPage;

        $sql = "SELECT * FROM products WHERE {$whereSql} ORDER BY name ASC LIMIT :limit OFFSET :offset";
        $stmt = $this->database->pdo()->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->bindValue('limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'items' => $stmt->fetchAll(),
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'has_more' => $page < $totalPages,
        ];
    }

    public function all(): array
    {
        return $this->database->pdo()
            ->query('SELECT * FROM products ORDER BY id ASC')
            ->fetchAll();
    }

    /**
     * @return array{items: array, total: int, page: int, per_page: int, total_pages: int}
     */
    public function adminPaginated(
        ?string $search,
        ?string $category,
        ?int $active,
        int $page,
        int $perPage,
        string $sort = 'id',
        string $dir = 'asc',
    ): array {
        $where = ['1=1'];
        $params = [];

        if ($search) {
            $where[] = 'name LIKE :search';
            $params['search'] = '%' . $search . '%';
        }

        if ($category) {
            $where[] = 'category = :category';
            $params['category'] = $category;
        }

        if ($active !== null) {
            $where[] = 'active = :active';
            $params['active'] = $active;
        }

        $whereSql = implode(' AND ', $where);

        $parsed = ProductListSort::parse($sort, $dir);
        $orderColumn = $parsed['sort'];
        $orderDir = strtoupper($parsed['dir']) === 'DESC' ? 'DESC' : 'ASC';

        $countStmt = $this->database->pdo()->prepare(
            "SELECT COUNT(*) FROM products WHERE {$whereSql}"
        );
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $totalPages = max(1, (int) ceil($total / $perPage));
        $page = min(max(1, $page), $totalPages);
        $offset = ($page - 1) * $perPage;

        $sql = "SELECT * FROM products WHERE {$whereSql} ORDER BY {$orderColumn} {$orderDir} LIMIT :limit OFFSET :offset";
        $stmt = $this->database->pdo()->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->bindValue('limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'items' => $stmt->fetchAll(),
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => $totalPages,
        ];
    }

    public function find(int $id): ?array
    {
        $stmt = $this->database->pdo()->prepare(
            'SELECT * FROM products WHERE id = :id AND active = 1 LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->database->pdo()->prepare('SELECT * FROM products WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function countActive(): int
    {
        return (int) $this->database->pdo()->query(
            'SELECT COUNT(*) FROM products WHERE active = 1'
        )->fetchColumn();
    }

    public function countAll(): int
    {
        return (int) $this->database->pdo()->query('SELECT COUNT(*) FROM products')->fetchColumn();
    }

    public function nextId(): int
    {
        return (int) $this->database->pdo()->query(
            'SELECT COALESCE(MAX(id), 0) + 1 FROM products'
        )->fetchColumn();
    }

    public function create(array $data): int
    {
        $stmt = $this->database->pdo()->prepare(
            'INSERT INTO products (id, name, category, price_fitc, description, image_url, tag, active)
             VALUES (:id, :name, :category, :price_fitc, :description, :image_url, :tag, :active)'
        );
        $stmt->execute($data);

        return (int) $data['id'];
    }

    public function update(int $id, array $data): void
    {
        $data['id'] = $id;
        $stmt = $this->database->pdo()->prepare(
            'UPDATE products SET
                name = :name,
                category = :category,
                price_fitc = :price_fitc,
                description = :description,
                image_url = :image_url,
                tag = :tag,
                active = :active
             WHERE id = :id'
        );
        $stmt->execute($data);
    }

    public function delete(int $id): void
    {
        $this->database->pdo()->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
    }

    /**
     * @param list<int> $ids
     * @param array{category?: string, tag?: string} $fields
     */
    public function bulkPatch(array $ids, array $fields): int
    {
        if ($ids === [] || $fields === []) {
            return 0;
        }

        $sets = [];
        $params = [];

        if (isset($fields['category'])) {
            $sets[] = 'category = :category';
            $params['category'] = $fields['category'];
        }

        if (isset($fields['tag'])) {
            $sets[] = 'tag = :tag';
            $params['tag'] = $fields['tag'];
        }

        if ($sets === []) {
            return 0;
        }

        $placeholders = [];
        foreach (array_values($ids) as $i => $id) {
            $key = 'pid' . $i;
            $placeholders[] = ':' . $key;
            $params[$key] = $id;
        }

        $sql = 'UPDATE products SET ' . implode(', ', $sets)
            . ' WHERE id IN (' . implode(', ', $placeholders) . ')';

        $stmt = $this->database->pdo()->prepare($sql);
        $stmt->execute($params);

        return $stmt->rowCount();
    }
}
