<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\AnnouncementRepository;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final class AnnouncementController
{
    public function __construct(
        private readonly AnnouncementRepository $announcements,
    ) {
    }

    public function published(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $items = $this->announcements->published(10);

        $response->getBody()->write(json_encode([
            'ok' => true,
            'announcements' => array_map(static fn (array $a) => [
                'id' => (int) $a['id'],
                'title' => $a['title'],
                'content_html' => $a['content_html'] ?? '',
                'image_url' => $a['image_url'] ?? null,
            ], $items),
        ], JSON_UNESCAPED_UNICODE));

        return $response->withHeader('Content-Type', 'application/json');
    }
}
