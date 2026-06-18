<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Repositories\ProductRepository;
use App\Services\UploadService;
use App\Repositories\ProductVariationRepository;
use App\Support\CatalogConfig;
use App\Support\ProductVariationValidator;
use App\Support\Csrf;
use App\Support\Htmx;
use App\Support\ProductListPerPage;
use App\Support\ProductListSort;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Views\Twig;

final class ProductController
{
    public function __construct(
        private readonly Twig $view,
        private readonly ProductRepository $products,
        private readonly ProductVariationRepository $variations,
        private readonly UploadService $uploads,
        private readonly CatalogConfig $catalog,
    ) {
    }

    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $context = $this->listContextFromRequest($request);

        if (Htmx::isRequest($request)) {
            return $this->view->render($response, 'admin/products/_list_results.twig', $context);
        }

        return $this->renderIndex($response, $context);
    }

    public function createForm(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $response->withHeader('Location', '/admin/produtos?modal=create')->withStatus(302);
    }

    public function store(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->save($request, $response, null);
    }

    public function editForm(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int) $args['id'];

        return $response
            ->withHeader('Location', '/admin/produtos?modal=edit&id=' . $id)
            ->withStatus(302);
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        return $this->save($request, $response, (int) $args['id']);
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        if (!Csrf::validate(($request->getParsedBody() ?? [])['_csrf'] ?? null)) {
            return $this->redirect($response, '/admin/produtos', 'Token inválido.', 'error');
        }

        $product = $this->products->findById((int) $args['id']);
        if ($product) {
            $this->uploads->deletePublicFile($product['image_url'] ?? null);
            $this->products->delete((int) $args['id']);
        }

        return $this->redirect($response, '/admin/produtos', 'Produto removido.', 'success');
    }

    public function bulkUpdate(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody() ?? [];

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->redirect($response, '/admin/produtos', 'Token inválido.', 'error');
        }

        $ids = $this->parseBulkProductIds($data);
        if ($ids === []) {
            return $this->redirect($response, '/admin/produtos', 'Selecione ao menos um produto.', 'error');
        }

        $fields = [];
        $category = trim((string) ($data['bulk_category'] ?? ''));
        $tag = trim((string) ($data['bulk_tag'] ?? ''));

        if ($category !== '' && $category !== '__keep__') {
            if (!$this->catalog->isValidCategory($category)) {
                return $this->redirect($response, '/admin/produtos', 'Categoria inválida.', 'error');
            }
            $fields['category'] = $category;
        }

        if ($tag !== '' && $tag !== '__keep__') {
            $fields['tag'] = $tag;
        }

        if ($fields === []) {
            return $this->redirect($response, '/admin/produtos', 'Escolha categoria e/ou tag para aplicar.', 'error');
        }

        $updated = $this->products->bulkPatch($ids, $fields);
        $listSuffix = $this->listQueryFromBody($data);

        return $this->redirect(
            $response,
            '/admin/produtos' . $listSuffix,
            $updated > 0
                ? sprintf('%d produto(s) atualizado(s).', $updated)
                : 'Nenhum produto foi alterado.',
            $updated > 0 ? 'success' : 'error',
        );
    }

    public function bulkDelete(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody() ?? [];

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->redirect($response, '/admin/produtos', 'Token inválido.', 'error');
        }

        $ids = $this->parseBulkProductIds($data);
        if ($ids === []) {
            return $this->redirect($response, '/admin/produtos', 'Selecione ao menos um produto.', 'error');
        }

        $deleted = 0;
        foreach ($ids as $id) {
            $product = $this->products->findById($id);
            if (!$product) {
                continue;
            }

            $this->uploads->deletePublicFile($product['image_url'] ?? null);
            $this->products->delete($id);
            $deleted++;
        }

        $listSuffix = $this->listQueryFromBody($data);

        return $this->redirect(
            $response,
            '/admin/produtos' . $listSuffix,
            $deleted > 0
                ? sprintf('%d produto(s) excluído(s).', $deleted)
                : 'Nenhum produto foi excluído.',
            $deleted > 0 ? 'success' : 'error',
        );
    }

    /**
     * @param array<string, mixed> $data
     * @return list<int>
     */
    private function parseBulkProductIds(array $data): array
    {
        $rawIds = $data['product_ids'] ?? [];
        if (!is_array($rawIds)) {
            $rawIds = [$rawIds];
        }

        return array_values(array_unique(array_filter(array_map('intval', $rawIds), fn ($id) => $id > 0)));
    }

    private function save(
        ServerRequestInterface $request,
        ResponseInterface $response,
        ?int $id
    ): ResponseInterface {
        $data = $request->getParsedBody() ?? [];
        $files = $request->getUploadedFiles();

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->formError($request, $response, $id, 'Sessão expirada. Tente novamente.', $data);
        }

        $name = trim((string) ($data['name'] ?? ''));
        $category = trim((string) ($data['category'] ?? ''));
        $price = (int) ($data['price_fitc'] ?? 0);
        $description = trim((string) ($data['description'] ?? ''));
        $tag = trim((string) ($data['tag'] ?? ''));
        $imageUrl = trim((string) ($data['image_url'] ?? ''));
        $active = isset($data['active']) ? 1 : 0;

        if ($name === '' || $category === '' || !$this->catalog->isValidCategory($category)) {
            return $this->formError($request, $response, $id, 'Preencha nome e categoria válidos.', $data);
        }

        if ($price < 1) {
            return $this->formError($request, $response, $id, 'Informe um preço em FITC válido.', $data);
        }

        $variationDefsPreview = $this->decodeVariationsJson($data['variations_json'] ?? '[]');
        $variationCheck = ProductVariationValidator::validateAdminDefinition($variationDefsPreview);
        if (!$variationCheck['ok']) {
            return $this->formError($request, $response, $id, $variationCheck['error'] ?? 'Variações inválidas.', $data);
        }

        $existing = $id ? $this->products->findById($id) : null;
        $existingVariations = ($id && $existing) ? $this->variations->forProduct($id) : [];
        $upload = $files['image'] ?? null;

        if ($upload && $upload->getError() !== UPLOAD_ERR_NO_FILE) {
            try {
                if ($existing && str_starts_with((string) $existing['image_url'], '/uploads/')) {
                    $this->uploads->deletePublicFile($existing['image_url']);
                }
                $imageUrl = $this->uploads->storeImage($upload, 'products');
            } catch (\Throwable $e) {
                return $this->formError($request, $response, $id, $e->getMessage(), $data);
            }
        } elseif ($imageUrl === '' && $existing) {
            $imageUrl = (string) ($existing['image_url'] ?? '');
        }

        $payload = [
            'name' => $name,
            'category' => $category,
            'price_fitc' => $price,
            'description' => $description,
            'image_url' => $imageUrl ?: null,
            'tag' => $tag ?: 'Geral',
            'active' => $active,
        ];

        $variationDefs = $this->parseVariationsFromRequest($request, $data, $existingVariations);

        if ($id && $existing) {
            $this->products->update($id, $payload);
            $this->variations->syncForProduct($id, $variationDefs);

            return $this->redirect($response, '/admin/produtos', 'Produto atualizado.', 'success');
        }

        $payload['id'] = $this->products->nextId();
        $this->products->create($payload);
        $this->variations->syncForProduct((int) $payload['id'], $variationDefs);

        return $this->redirect($response, '/admin/produtos', 'Produto criado.', 'success');
    }

    /**
     * @param list<array<string, mixed>> $existingVariations
     * @return list<array<string, mixed>>
     */
    private function parseVariationsFromRequest(
        ServerRequestInterface $request,
        array $data,
        array $existingVariations = []
    ): array {
        $raw = trim((string) ($data['variations_json'] ?? '[]'));
        $parsed = json_decode($raw, true);
        if (!is_array($parsed)) {
            return [];
        }

        $existingImages = $this->existingVariationImageMap($existingVariations);
        $files = $request->getUploadedFiles();

        foreach (array_values($parsed) as $attrIndex => &$attr) {
            if (!is_array($attr['options'] ?? null)) {
                $attr['options'] = [];
                continue;
            }

            $options = array_values($attr['options']);
            foreach ($options as $optIndex => &$opt) {
                $key = "variation_image_{$attrIndex}_{$optIndex}";
                $upload = $files[$key] ?? null;

                if ($upload && $upload->getError() !== UPLOAD_ERR_NO_FILE) {
                    try {
                        $opt['image_url'] = $this->uploads->storeImage($upload, 'products/variations');
                    } catch (\Throwable) {
                        // mantém URL existente se upload falhar
                    }
                }

                $currentUrl = trim((string) ($opt['image_url'] ?? ''));
                if ($currentUrl === '') {
                    $attrName = trim((string) ($attr['name'] ?? ''));
                    $label = trim((string) ($opt['label'] ?? ''));
                    $lookup = $attrName . "\0" . $label;
                    if (isset($existingImages[$lookup])) {
                        $opt['image_url'] = $existingImages[$lookup];
                    }
                }
            }
            unset($opt);

            $attr['options'] = $options;
        }
        unset($attr);

        return array_values(array_filter($parsed, function ($attr) {
            return trim((string) ($attr['name'] ?? '')) !== '';
        }));
    }

    /**
     * @param list<array<string, mixed>> $existingVariations
     * @return array<string, string>
     */
    private function existingVariationImageMap(array $existingVariations): array
    {
        $map = [];

        foreach ($existingVariations as $attr) {
            $attrName = trim((string) ($attr['name'] ?? ''));
            if ($attrName === '') {
                continue;
            }

            foreach ($attr['options'] ?? [] as $opt) {
                $label = trim((string) ($opt['label'] ?? ''));
                $url = trim((string) ($opt['image_url'] ?? ''));
                if ($label !== '' && $url !== '') {
                    $map[$attrName . "\0" . $label] = $url;
                }
            }
        }

        return $map;
    }

    private function formError(
        ServerRequestInterface $request,
        ResponseInterface $response,
        ?int $id,
        string $error,
        array $input
    ): ResponseInterface {
        $product = $id ? $this->products->findById($id) : null;

        if (!$product) {
            $product = [
                'name' => trim((string) ($input['name'] ?? '')),
                'category' => trim((string) ($input['category'] ?? '')),
                'price_fitc' => (int) ($input['price_fitc'] ?? 0),
                'description' => trim((string) ($input['description'] ?? '')),
                'image_url' => trim((string) ($input['image_url'] ?? '')),
                'tag' => trim((string) ($input['tag'] ?? '')),
                'active' => isset($input['active']) ? 1 : 0,
                'variations' => $this->decodeVariationsJson($input['variations_json'] ?? '[]'),
            ];
        } else {
            $product = array_merge($product, [
                'name' => trim((string) ($input['name'] ?? $product['name'])),
                'category' => trim((string) ($input['category'] ?? $product['category'])),
                'price_fitc' => (int) ($input['price_fitc'] ?? $product['price_fitc']),
                'description' => trim((string) ($input['description'] ?? $product['description'])),
                'image_url' => trim((string) ($input['image_url'] ?? $product['image_url'])),
                'tag' => trim((string) ($input['tag'] ?? $product['tag'])),
                'active' => isset($input['active']) ? 1 : 0,
                'variations' => $this->decodeVariationsJson($input['variations_json'] ?? json_encode($product['variations'] ?? [])),
            ]);
        }

        return $this->renderIndex($response, array_merge(
            $this->listContextFromRequest($request),
            [
                'modal_form' => [
                    'open' => true,
                    'mode' => $id ? 'edit' : 'create',
                    'product' => $product,
                    'error' => $error,
                ],
            ]
        ));
    }

    /** @return array<string, mixed> */
    private function listContextFromRequest(ServerRequestInterface $request): array
    {
        $params = array_merge(
            $request->getQueryParams(),
            $this->listParamsFromBody($request->getParsedBody() ?? [])
        );
        $search = trim((string) ($params['q'] ?? ''));
        $category = trim((string) ($params['categoria'] ?? ''));
        $status = trim((string) ($params['status'] ?? ''));
        $page = max(1, (int) ($params['page'] ?? 1));

        $active = null;
        if ($status === 'ativo') {
            $active = 1;
        } elseif ($status === 'inativo') {
            $active = 0;
        }

        $validCategory = ($category !== '' && $this->catalog->isValidCategory($category)) ? $category : '';

        $sorting = ProductListSort::parse(
            isset($params['sort']) ? (string) $params['sort'] : null,
            isset($params['dir']) ? (string) $params['dir'] : null,
        );

        $perPage = ProductListPerPage::resolve(
            isset($params['per_page']) ? (string) $params['per_page'] : null,
        );

        $result = $this->products->adminPaginated(
            $search !== '' ? $search : null,
            $validCategory !== '' ? $validCategory : null,
            $active,
            $page,
            $perPage,
            $sorting['sort'],
            $sorting['dir'],
        );

        $products = $result['items'];
        $productIds = array_map(fn ($row) => (int) $row['id'], $products);
        $variationsByProduct = $this->variations->groupedByProductIds($productIds);

        foreach ($products as &$row) {
            $row['variations'] = $variationsByProduct[(int) $row['id']] ?? [];
        }
        unset($row);

        if (($params['modal'] ?? '') === 'edit' && !empty($params['id'])) {
            $editId = (int) $params['id'];
            $exists = false;
            foreach ($products as $row) {
                if ((int) $row['id'] === $editId) {
                    $exists = true;
                    break;
                }
            }
            if (!$exists) {
                $extra = $this->products->findById($editId);
                if ($extra) {
                    $extra['variations'] = $this->variations->forProduct($editId);
                    $products[] = $extra;
                }
            }
        }

        return [
            'products' => $products,
            'categories' => $this->catalog->categoryMap(),
            'tags' => $this->catalog->activeTags(),
            'pagination' => [
                'page' => $result['page'],
                'per_page' => $result['per_page'],
                'total' => $result['total'],
                'total_pages' => $result['total_pages'],
            ],
            'filters' => [
                'q' => $search,
                'categoria' => $validCategory,
                'status' => in_array($status, ['ativo', 'inativo'], true) ? $status : '',
                'sort' => $sorting['sort'],
                'dir' => $sorting['dir'],
                'per_page' => $perPage,
            ],
            'per_page_options' => ProductListPerPage::allowed(),
        ];
    }

    /** @param array<string, mixed> $body */
    private function listParamsFromBody(array $body): array
    {
        $out = [];

        if (array_key_exists('_list_q', $body)) {
            $out['q'] = (string) $body['_list_q'];
        }
        if (array_key_exists('_list_categoria', $body)) {
            $out['categoria'] = (string) $body['_list_categoria'];
        }
        if (array_key_exists('_list_status', $body)) {
            $out['status'] = (string) $body['_list_status'];
        }
        if (array_key_exists('_list_page', $body)) {
            $out['page'] = (string) $body['_list_page'];
        }
        if (array_key_exists('_list_sort', $body)) {
            $out['sort'] = (string) $body['_list_sort'];
        }
        if (array_key_exists('_list_dir', $body)) {
            $out['dir'] = (string) $body['_list_dir'];
        }
        if (array_key_exists('_list_per_page', $body)) {
            $out['per_page'] = (string) $body['_list_per_page'];
        }

        return $out;
    }

    /** @param array<string, mixed> $body */
    private function listQueryFromBody(array $body): string
    {
        $params = $this->listParamsFromBody($body);
        $parts = [];

        if (($params['q'] ?? '') !== '') {
            $parts[] = 'q=' . rawurlencode((string) $params['q']);
        }
        if (($params['categoria'] ?? '') !== '') {
            $parts[] = 'categoria=' . rawurlencode((string) $params['categoria']);
        }
        if (($params['status'] ?? '') !== '') {
            $parts[] = 'status=' . rawurlencode((string) $params['status']);
        }
        if (($params['sort'] ?? 'id') !== 'id') {
            $parts[] = 'sort=' . rawurlencode((string) $params['sort']);
        }
        if (($params['dir'] ?? 'asc') === 'desc') {
            $parts[] = 'dir=desc';
        }
        if ((int) ($params['per_page'] ?? 15) !== 15) {
            $parts[] = 'per_page=' . (int) $params['per_page'];
        }
        if ((int) ($params['page'] ?? 1) > 1) {
            $parts[] = 'page=' . (int) $params['page'];
        }

        return $parts === [] ? '' : '?' . implode('&', $parts);
    }

    private function renderIndex(ResponseInterface $response, array $extra = []): ResponseInterface
    {
        $flash = $_SESSION['flash'] ?? null;
        unset($_SESSION['flash']);

        $defaults = [
            'products' => [],
            'categories' => $this->catalog->categoryMap(),
            'tags' => $this->catalog->activeTags(),
            'variation_presets' => $this->catalog->activePresets(),
            'flash' => $flash,
            'modal_form' => null,
            'active_nav' => 'products',
            'pagination' => [
                'page' => 1,
                'per_page' => ProductListPerPage::DEFAULT,
                'total' => 0,
                'total_pages' => 1,
            ],
            'filters' => [
                'q' => '',
                'categoria' => '',
                'status' => '',
                'sort' => 'id',
                'dir' => 'asc',
                'per_page' => ProductListPerPage::DEFAULT,
            ],
            'per_page_options' => ProductListPerPage::allowed(),
        ];

        return $this->view->render($response, 'admin/products/index.twig', array_merge($defaults, $extra));
    }

    private function redirect(ResponseInterface $response, string $url, string $message, string $type): ResponseInterface
    {
        $_SESSION['flash'] = ['type' => $type, 'message' => $message];

        return $response->withHeader('Location', $url)->withStatus(302);
    }

    /** @return list<array<string, mixed>> */
    private function decodeVariationsJson(mixed $raw): array
    {
        if (is_array($raw)) {
            return $raw;
        }

        $parsed = json_decode((string) $raw, true);

        return is_array($parsed) ? $parsed : [];
    }
}
