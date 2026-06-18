<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Repositories\AnnouncementRepository;
use App\Services\HtmlSanitizer;
use App\Services\UploadService;
use App\Support\Csrf;
use App\Support\Slug;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Psr7\Response;
use Slim\Views\Twig;

final class AnnouncementController
{
    public function __construct(
        private readonly Twig $view,
        private readonly AnnouncementRepository $announcements,
        private readonly UploadService $uploads,
        private readonly HtmlSanitizer $sanitizer,
    ) {
    }

    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $flash = $_SESSION['flash'] ?? null;
        unset($_SESSION['flash']);

        return $this->view->render($response, 'admin/announcements/index.twig', [
            'announcements' => $this->announcements->all(),
            'flash' => $flash,
            'active_nav' => 'announcements',
        ]);
    }

    public function createForm(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->view->render($response, 'admin/announcements/form.twig', [
            'announcement' => null,
            'error' => null,
            'active_nav' => 'announcements',
        ]);
    }

    public function store(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->save($request, $response, null);
    }

    public function editForm(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $announcement = $this->announcements->find((int) $args['id']);
        if (!$announcement) {
            return $response->withHeader('Location', '/admin/anuncios')->withStatus(302);
        }

        return $this->view->render($response, 'admin/announcements/form.twig', [
            'announcement' => $announcement,
            'error' => null,
            'active_nav' => 'announcements',
        ]);
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        return $this->save($request, $response, (int) $args['id']);
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        if (!Csrf::validate(($request->getParsedBody() ?? [])['_csrf'] ?? null)) {
            return $this->redirect($response, '/admin/anuncios', 'Token inválido.', 'error');
        }

        $announcement = $this->announcements->find((int) $args['id']);
        if ($announcement) {
            $this->uploads->deletePublicFile($announcement['image_url'] ?? null);
            $this->announcements->delete((int) $args['id']);
        }

        return $this->redirect($response, '/admin/anuncios', 'Anúncio removido.', 'success');
    }

    private function save(
        ServerRequestInterface $request,
        ResponseInterface $response,
        ?int $id
    ): ResponseInterface {
        $data = $request->getParsedBody() ?? [];
        $files = $request->getUploadedFiles();

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->renderFormError($response, $id, 'Sessão expirada. Tente novamente.', $data);
        }

        $title = trim((string) ($data['title'] ?? ''));
        $status = ($data['status'] ?? 'draft') === 'published' ? 'published' : 'draft';
        $content = $this->sanitizer->clean((string) ($data['content_html'] ?? ''));
        $cropData = trim((string) ($data['crop_data'] ?? ''));

        if ($title === '') {
            return $this->renderFormError($response, $id, 'Informe o título do anúncio.', $data);
        }

        $existing = $id ? $this->announcements->find($id) : null;
        $slug = Slug::unique(
            $title,
            fn (string $s) => $this->announcements->slugExists($s, $id)
        );

        $imageUrl = $existing['image_url'] ?? null;
        $upload = $files['image'] ?? null;

        if ($upload && $upload->getError() !== UPLOAD_ERR_NO_FILE) {
            try {
                if ($imageUrl) {
                    $this->uploads->deletePublicFile($imageUrl);
                }
                $imageUrl = $this->uploads->storeImage($upload);
            } catch (\Throwable $e) {
                return $this->renderFormError($response, $id, $e->getMessage(), $data);
            }
        }

        $payload = [
            'title' => $title,
            'slug' => $slug,
            'content_html' => $content,
            'image_url' => $imageUrl,
            'crop_data' => $cropData !== '' ? $cropData : null,
            'status' => $status,
            'published_at' => $status === 'published' ? date('Y-m-d H:i:s') : null,
            'created_by' => $_SESSION['user_id'] ?? null,
        ];

        if ($id && $existing) {
            if ($status === 'published' && empty($existing['published_at'])) {
                $payload['published_at'] = date('Y-m-d H:i:s');
            } elseif ($status === 'draft') {
                $payload['published_at'] = null;
            } else {
                $payload['published_at'] = $existing['published_at'];
            }
            unset($payload['created_by']);
            $this->announcements->update($id, $payload);
            return $this->redirect($response, '/admin/anuncios', 'Anúncio atualizado.', 'success');
        }

        $this->announcements->create($payload);
        return $this->redirect($response, '/admin/anuncios', 'Anúncio criado.', 'success');
    }

    private function renderFormError(ResponseInterface $response, ?int $id, string $error, array $input = []): ResponseInterface
    {
        $announcement = $id ? $this->announcements->find($id) : null;

        if (!$announcement) {
            $announcement = [
                'title' => trim((string) ($input['title'] ?? '')),
                'content_html' => (string) ($input['content_html'] ?? ''),
                'status' => ($input['status'] ?? 'draft') === 'published' ? 'published' : 'draft',
                'image_url' => null,
            ];
        } else {
            $announcement['title'] = trim((string) ($input['title'] ?? $announcement['title']));
            $announcement['content_html'] = (string) ($input['content_html'] ?? $announcement['content_html']);
            $announcement['status'] = ($input['status'] ?? $announcement['status']) === 'published' ? 'published' : 'draft';
        }

        return $this->view->render($response, 'admin/announcements/form.twig', [
            'announcement' => $announcement,
            'error' => $error,
            'active_nav' => 'announcements',
        ]);
    }

    private function redirect(ResponseInterface $response, string $url, string $message, string $type): ResponseInterface
    {
        $_SESSION['flash'] = ['type' => $type, 'message' => $message];

        return $response->withHeader('Location', $url)->withStatus(302);
    }
}
