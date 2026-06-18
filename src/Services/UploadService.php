<?php

declare(strict_types=1);

namespace App\Services;

use Psr\Http\Message\UploadedFileInterface;
use RuntimeException;

final class UploadService
{
    public function __construct(private readonly string $root)
    {
    }

    public function storeImage(UploadedFileInterface $file, string $subdir = 'announcements'): string
    {
        if ($file->getError() !== UPLOAD_ERR_OK) {
            throw new RuntimeException('Falha no upload da imagem.');
        }

        $maxMb = (int) ($_ENV['UPLOAD_MAX_MB'] ?? 5);
        if ($file->getSize() > $maxMb * 1024 * 1024) {
            throw new RuntimeException("Imagem excede {$maxMb}MB.");
        }

        $mime = $file->getClientMediaType();
        $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        if (!isset($allowed[$mime])) {
            throw new RuntimeException('Formato de imagem não permitido.');
        }

        $dir = $this->root . '/public/uploads/' . $subdir;
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $name = bin2hex(random_bytes(12)) . '.' . $allowed[$mime];
        $file->moveTo($dir . '/' . $name);

        return '/uploads/' . $subdir . '/' . $name;
    }

    public function deletePublicFile(?string $publicPath): void
    {
        if (!$publicPath || !str_starts_with($publicPath, '/uploads/')) {
            return;
        }

        $full = $this->root . '/public' . $publicPath;
        if (is_file($full)) {
            unlink($full);
        }
    }
}
