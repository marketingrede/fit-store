<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Repositories\CategoryRepository;
use App\Repositories\CatalogCtaCardRepository;
use App\Repositories\TagRepository;
use App\Repositories\VariationPresetRepository;
use App\Services\UploadService;
use App\Support\Csrf;
use App\Support\Htmx;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Views\Twig;

final class SettingsController
{
    public function __construct(
        private readonly Twig $view,
        private readonly CategoryRepository $categories,
        private readonly TagRepository $tags,
        private readonly VariationPresetRepository $presets,
        private readonly CatalogCtaCardRepository $ctaCards,
        private readonly UploadService $uploads,
    ) {
    }

    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->view->render($response, 'admin/settings/index.twig', [
            'active_nav' => 'settings',
            'category_count' => count($this->categories->all()),
            'tag_count' => count($this->tags->all()),
            'preset_count' => count($this->presets->all()),
            'cta_count' => count($this->ctaCards->all()),
        ]);
    }

    public function ctas(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->view->render($response, 'admin/settings/ctas.twig', [
            'active_nav' => 'settings_ctas',
            'items' => $this->ctaCards->all(),
            'flash' => $this->pullFlash(),
        ]);
    }

    public function updateCtas(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = (array) $request->getParsedBody();

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->flashRedirect($response, '/admin/configuracoes/ctas', 'Sessão expirada.', 'error');
        }

        $uploadedFiles = $request->getUploadedFiles();
        $slots = [1, 2];

        try {
            foreach ($slots as $slot) {
                $current = $this->findCtaBySlot($slot);
                $slotData = (array) ($data['cards'][$slot] ?? []);
                $slotFiles = (array) ($uploadedFiles['cards'][$slot] ?? []);

                $imageUrl = trim((string) ($slotData['image_url'] ?? ($current['image_url'] ?? '')));
                if (!empty($slotData['remove_image'])) {
                    $this->uploads->deletePublicFile($imageUrl);
                    $imageUrl = '';
                }

                $upload = $slotFiles['image_file'] ?? null;
                if ($upload && $upload->getError() !== UPLOAD_ERR_NO_FILE) {
                    if ($imageUrl !== '') {
                        $this->uploads->deletePublicFile($imageUrl);
                    }
                    $imageUrl = $this->uploads->storeImage($upload, 'catalog-ctas');
                }

                $this->ctaCards->updateSlot($slot, [
                    'variant' => in_array(($slotData['variant'] ?? ''), ['teal', 'blue', 'surface'], true)
                        ? (string) $slotData['variant']
                        : 'teal',
                    'title' => trim((string) ($slotData['title'] ?? '')) ?: null,
                    'body' => trim((string) ($slotData['body'] ?? '')) ?: null,
                    'link_url' => trim((string) ($slotData['link_url'] ?? '')) ?: null,
                    'link_label' => trim((string) ($slotData['link_label'] ?? '')) ?: null,
                    'image_url' => $imageUrl !== '' ? $imageUrl : null,
                    'active' => $this->parseActive($slotData['active'] ?? '0'),
                ]);
            }
        } catch (\Throwable $e) {
            return $this->flashRedirect($response, '/admin/configuracoes/ctas', $e->getMessage(), 'error');
        }

        return $this->flashRedirect($response, '/admin/configuracoes/ctas', 'Cards de destaque atualizados.', 'success');
    }

    public function toggleCtaActive(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $data = (array) $request->getParsedBody();
        $slot = (int) ($args['slot'] ?? 0);

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->json($response, ['ok' => false, 'message' => 'Sessão expirada.'], 419);
        }

        if (!in_array($slot, [1, 2], true)) {
            return $this->json($response, ['ok' => false, 'message' => 'Card inválido.'], 400);
        }

        $active = $this->parseActive($data['active'] ?? '0');
        $this->ctaCards->setActive($slot, $active);

        return $this->json($response, [
            'ok' => true,
            'active' => $active,
            'message' => $active ? 'Card ativado na loja.' : 'Card desativado na loja.',
        ]);
    }

    public function categories(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->view->render($response, 'admin/settings/categories.twig', [
            'active_nav' => 'settings_categories',
            'items' => $this->categories->all(),
            'flash' => $this->pullFlash(),
            'error' => null,
        ]);
    }

    public function storeCategory(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = (array) $request->getParsedBody();

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->respondCategories($request, $response, 'error', 'Sessão expirada.', 422);
        }

        $label = trim((string) ($data['label'] ?? ''));
        $slug = trim((string) ($data['slug'] ?? '')) ?: $this->slugify($label);
        $sortOrder = (int) ($data['sort_order'] ?? 0);
        $active = isset($data['active']);

        if ($label === '' || $slug === '') {
            return $this->respondCategories($request, $response, 'error', 'Informe o nome da categoria.', 422);
        }

        if ($this->categories->slugExists($slug)) {
            return $this->respondCategories($request, $response, 'error', 'Já existe uma categoria com este slug.', 422);
        }

        $this->categories->create($slug, $label, $sortOrder, $active);

        return $this->respondCategories($request, $response, 'success', 'Categoria criada.');
    }

    public function updateCategory(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int) ($args['id'] ?? 0);
        $data = (array) $request->getParsedBody();

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->respondCategories($request, $response, 'error', 'Sessão expirada.', 422);
        }

        $item = $this->categories->find($id);
        if (!$item) {
            return $this->respondCategories($request, $response, 'error', 'Categoria não encontrada.', 422);
        }

        $label = trim((string) ($data['label'] ?? ''));
        $slug = trim((string) ($data['slug'] ?? '')) ?: $this->slugify($label);
        $sortOrder = (int) ($data['sort_order'] ?? 0);
        $active = isset($data['active']);

        if ($label === '' || $slug === '') {
            return $this->respondCategories($request, $response, 'error', 'Informe o nome da categoria.', 422);
        }

        if ($this->categories->slugExists($slug, $id)) {
            return $this->respondCategories($request, $response, 'error', 'Já existe uma categoria com este slug.', 422);
        }

        $this->categories->update($id, $slug, $label, $sortOrder, $active);

        return $this->respondCategories($request, $response, 'success', 'Categoria atualizada.');
    }

    public function deleteCategory(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int) ($args['id'] ?? 0);
        $data = (array) $request->getParsedBody();

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->respondCategories($request, $response, 'error', 'Sessão expirada.', 422);
        }

        $this->categories->delete($id);

        return $this->respondCategories($request, $response, 'success', 'Categoria removida.');
    }

    public function tags(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->view->render($response, 'admin/settings/tags.twig', [
            'active_nav' => 'settings_tags',
            'items' => $this->tags->all(),
            'flash' => $this->pullFlash(),
        ]);
    }

    public function storeTag(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = (array) $request->getParsedBody();

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->respondTags($request, $response, 'error', 'Sessão expirada.', 422);
        }

        $name = trim((string) ($data['name'] ?? ''));
        $color = trim((string) ($data['color'] ?? '')) ?: null;
        $sortOrder = (int) ($data['sort_order'] ?? 0);
        $active = isset($data['active']);

        if ($name === '') {
            return $this->respondTags($request, $response, 'error', 'Informe o nome da tag.', 422);
        }

        if ($this->tags->nameExists($name)) {
            return $this->respondTags($request, $response, 'error', 'Já existe uma tag com este nome.', 422);
        }

        $this->tags->create($name, $color, $sortOrder, $active);

        return $this->respondTags($request, $response, 'success', 'Tag criada.');
    }

    public function updateTag(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int) ($args['id'] ?? 0);
        $data = (array) $request->getParsedBody();

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->respondTags($request, $response, 'error', 'Sessão expirada.', 422);
        }

        $item = $this->tags->find($id);
        if (!$item) {
            return $this->respondTags($request, $response, 'error', 'Tag não encontrada.', 422);
        }

        $name = trim((string) ($data['name'] ?? ''));
        $color = trim((string) ($data['color'] ?? '')) ?: null;
        $sortOrder = (int) ($data['sort_order'] ?? 0);
        $active = isset($data['active']);

        if ($name === '') {
            return $this->respondTags($request, $response, 'error', 'Informe o nome da tag.', 422);
        }

        if ($this->tags->nameExists($name, $id)) {
            return $this->respondTags($request, $response, 'error', 'Já existe uma tag com este nome.', 422);
        }

        $this->tags->update($id, $name, $color, $sortOrder, $active);

        return $this->respondTags($request, $response, 'success', 'Tag atualizada.');
    }

    public function deleteTag(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int) ($args['id'] ?? 0);
        $data = (array) $request->getParsedBody();

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->respondTags($request, $response, 'error', 'Sessão expirada.', 422);
        }

        $this->tags->delete($id);

        return $this->respondTags($request, $response, 'success', 'Tag removida.');
    }

    public function variations(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->view->render($response, 'admin/settings/variations.twig', [
            'active_nav' => 'settings_variations',
            'items' => $this->presets->all(),
            'flash' => $this->pullFlash(),
        ]);
    }

    public function storeVariationPreset(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = (array) $request->getParsedBody();
        $parsed = $this->parsePresetInput($data);

        if ($parsed['error']) {
            return $this->respondVariations($request, $response, 'error', $parsed['error'], 422);
        }

        $this->presets->create(
            $parsed['name'],
            $parsed['unit'],
            $parsed['required'],
            $parsed['allow_option_image'],
            $parsed['options'],
            $parsed['sort_order'],
            $parsed['active'],
        );

        return $this->respondVariations($request, $response, 'success', 'Preset de variação criado.');
    }

    public function updateVariationPreset(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int) ($args['id'] ?? 0);
        $data = (array) $request->getParsedBody();
        $parsed = $this->parsePresetInput($data);

        if ($parsed['error']) {
            return $this->respondVariations($request, $response, 'error', $parsed['error'], 422);
        }

        if (!$this->presets->find($id)) {
            return $this->respondVariations($request, $response, 'error', 'Preset não encontrado.', 422);
        }

        $this->presets->update(
            $id,
            $parsed['name'],
            $parsed['unit'],
            $parsed['required'],
            $parsed['allow_option_image'],
            $parsed['options'],
            $parsed['sort_order'],
            $parsed['active'],
        );

        return $this->respondVariations($request, $response, 'success', 'Preset atualizado.');
    }

    public function deleteVariationPreset(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int) ($args['id'] ?? 0);
        $data = (array) $request->getParsedBody();

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->respondVariations($request, $response, 'error', 'Sessão expirada.', 422);
        }

        $this->presets->delete($id);

        return $this->respondVariations($request, $response, 'success', 'Preset removido.');
    }

    /** @param array<string, mixed> $data */
    private function parsePresetInput(array $data): array
    {
        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return ['error' => 'Sessão expirada.'];
        }

        $name = trim((string) ($data['name'] ?? ''));
        $unit = trim((string) ($data['unit'] ?? ''));
        $required = isset($data['required']);
        $allowOptionImage = isset($data['allow_option_image']);
        $sortOrder = (int) ($data['sort_order'] ?? 0);
        $active = isset($data['active']);
        $optionsRaw = trim((string) ($data['options'] ?? ''));
        $options = array_values(array_filter(array_map(
            fn ($v) => trim($v),
            preg_split('/[\r\n,]+/', $optionsRaw) ?: []
        )));

        if ($name === '') {
            return ['error' => 'Informe o nome do atributo.'];
        }

        if ($options === []) {
            return ['error' => 'Informe ao menos uma opção.'];
        }

        return [
            'error' => null,
            'name' => $name,
            'unit' => $unit,
            'required' => $required,
            'allow_option_image' => $allowOptionImage,
            'sort_order' => $sortOrder,
            'active' => $active,
            'options' => $options,
        ];
    }

    private function slugify(string $text): string
    {
        $text = strtolower(trim($text));
        $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';

        return trim($text, '-') ?: 'categoria';
    }

    private function findCtaBySlot(int $slot): array
    {
        foreach ($this->ctaCards->all() as $item) {
            if ((int) ($item['slot'] ?? 0) === $slot) {
                return $item;
            }
        }

        return [];
    }

    private function parseActive(mixed $value): bool
    {
        if (is_array($value)) {
            $value = end($value);
        }

        if (is_bool($value)) {
            return $value;
        }

        return in_array((string) $value, ['1', 'true', 'on', 'yes'], true);
    }

    /** @param array<string, mixed> $payload */
    private function json(ResponseInterface $response, array $payload, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE));

        return $response
            ->withStatus($status)
            ->withHeader('Content-Type', 'application/json');
    }

    /** @return array{type: string, message: string}|null */
    private function pullFlash(): ?array
    {
        $flash = $_SESSION['flash'] ?? null;
        unset($_SESSION['flash']);

        return $flash;
    }

    private function flashRedirect(ResponseInterface $response, string $url, string $message, string $type): ResponseInterface
    {
        $_SESSION['flash'] = ['type' => $type, 'message' => $message];

        return $response->withHeader('Location', $url)->withStatus(302);
    }

    private function respondCategories(
        ServerRequestInterface $request,
        ResponseInterface $response,
        string $type,
        string $message,
        int $status = 200,
    ): ResponseInterface {
        if (!Htmx::isRequest($request)) {
            return $this->flashRedirect($response, '/admin/configuracoes/categorias', $message, $type);
        }

        return $this->view->render($response->withStatus($status), 'admin/settings/partials/categories_mutation.twig', [
            'items' => $this->categories->all(),
            'flash' => ['type' => $type, 'message' => $message],
        ]);
    }

    private function respondTags(
        ServerRequestInterface $request,
        ResponseInterface $response,
        string $type,
        string $message,
        int $status = 200,
    ): ResponseInterface {
        if (!Htmx::isRequest($request)) {
            return $this->flashRedirect($response, '/admin/configuracoes/tags', $message, $type);
        }

        return $this->view->render($response->withStatus($status), 'admin/settings/partials/tags_mutation.twig', [
            'items' => $this->tags->all(),
            'flash' => ['type' => $type, 'message' => $message],
        ]);
    }

    private function respondVariations(
        ServerRequestInterface $request,
        ResponseInterface $response,
        string $type,
        string $message,
        int $status = 200,
    ): ResponseInterface {
        if (!Htmx::isRequest($request)) {
            return $this->flashRedirect($response, '/admin/configuracoes/variacoes', $message, $type);
        }

        return $this->view->render($response->withStatus($status), 'admin/settings/partials/variations_mutation.twig', [
            'items' => $this->presets->all(),
            'flash' => ['type' => $type, 'message' => $message],
        ]);
    }
}
