<?php

declare(strict_types=1);

namespace App\Support;

final class CategoryLabels
{
  public const MAP = [
    'alimentos-proteicos' => 'Alimentos Proteicos',
    'equipamentos' => 'Equipamentos',
    'protecao-solar' => 'Proteção Solar',
    'vitaminas-minerais' => 'Vitaminas & Minerais',
    'acessorios-musculacao' => 'Acessórios Musculação',
    'medicao' => 'Medição',
    'vestuario' => 'Vestuário',
    'creatina-energia' => 'Creatina & Energia',
    'proteinas' => 'Proteínas',
    'eletronicos' => 'Eletrônicos',
  ];

  public static function label(string $slug): string
  {
    return self::MAP[$slug] ?? $slug;
  }
}
