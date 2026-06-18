<?php

declare(strict_types=1);

namespace App\Support;

use App\Repositories\CategoryRepository;
use App\Repositories\TagRepository;
use App\Repositories\VariationPresetRepository;

final class CatalogConfig
{
    public function __construct(
        private readonly CategoryRepository $categories,
        private readonly TagRepository $tags,
        private readonly VariationPresetRepository $presets,
    ) {
    }

    /** @return array<string, string> */
    public function categoryMap(): array
    {
        $map = $this->categories->activeMap();

        return $map !== [] ? $map : CategoryLabels::MAP;
    }

    public function isValidCategory(string $slug): bool
    {
        return isset($this->categoryMap()[$slug]);
    }

    /** @return list<array<string, mixed>> */
    public function activeTags(): array
    {
        return $this->tags->allActive();
    }

    /** @return list<array<string, mixed>> */
    public function activePresets(): array
    {
        return $this->presets->allActive();
    }
}
