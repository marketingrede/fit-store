<?php

declare(strict_types=1);

namespace App\Twig;

use App\Support\CategoryLabels;
use App\Support\Csrf;
use App\Support\Vite;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

final class AppExtension extends AbstractExtension
{
    public function getFunctions(): array
    {
        return [
            new TwigFunction('vite', [Vite::class, 'asset']),
            new TwigFunction('vite_css', [Vite::class, 'css']),
            new TwigFunction('csrf_token', [Csrf::class, 'token']),
            new TwigFunction('category_label', [CategoryLabels::class, 'label']),
        ];
    }
}
