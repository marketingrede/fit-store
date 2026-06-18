<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\ProductRepository;
use App\Repositories\ProductVariationRepository;
use App\Repositories\TradeRequestRepository;
use App\Support\Csrf;
use App\Support\ProductVariationValidator;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final class TradeController
{
    public function __construct(
        private readonly TradeRequestRepository $trades,
        private readonly ProductRepository $products,
        private readonly ProductVariationRepository $variations,
    ) {
    }

    public function submit(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody() ?? [];

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->json($response, ['ok' => false, 'error' => 'Token inválido.'], 419);
        }

        $name = trim((string) ($data['name'] ?? ''));
        $email = trim((string) ($data['email'] ?? ''));
        $productId = (int) ($data['productId'] ?? 0);
        $productName = trim((string) ($data['productName'] ?? ''));
        $productPrice = (int) ($data['productPriceFitc'] ?? 0);
        $selectionRaw = (string) ($data['productSelection'] ?? '{}');
        $selection = json_decode($selectionRaw, true);
        if (!is_array($selection)) {
            $selection = [];
        }

        if ($name === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json($response, ['ok' => false, 'error' => 'Dados inválidos.'], 400);
        }

        if ($productName === '') {
            return $this->json($response, ['ok' => false, 'error' => 'Produto inválido.'], 400);
        }

        $product = $productId > 0 ? $this->products->find($productId) : null;
        $attributes = $product ? $this->variations->forProduct($productId) : [];
        $basePrice = $product ? (int) $product['price_fitc'] : $productPrice;

        $validated = ProductVariationValidator::validate($attributes, $selection, $basePrice);
        if (!$validated['ok']) {
            return $this->json($response, ['ok' => false, 'error' => $validated['error'] ?? 'Seleção inválida.'], 400);
        }

        if (isset($validated['price_fitc'])) {
            $productPrice = (int) $validated['price_fitc'];
        }

        $selectionPayload = [
            'choices' => $validated['summary'] ?? [],
            'raw' => $selection,
        ];

        $this->trades->create([
            'name' => $name,
            'email' => $email,
            'product_id' => $productId ?: null,
            'product_name' => $productName,
            'product_price_fitc' => $productPrice,
            'product_selection_json' => json_encode($selectionPayload, JSON_UNESCAPED_UNICODE),
        ]);

        $to = $_ENV['SMTP_TO'] ?? '';
        if ($to !== '') {
            $subject = 'Troca de Fitcoin - ' . $productName;
            $variationLines = '';
            foreach ($validated['summary'] ?? [] as $row) {
                $variationLines .= "  - {$row['attribute']}: {$row['label']}\n";
            }

            $body = "Solicitação de troca de Fitcoin\n\n"
                . "Nome: {$name}\n"
                . "E-mail: {$email}\n"
                . "Produto: {$productName} (ID {$productId})\n"
                . "Preço: {$productPrice} FITC\n";

            if ($variationLines !== '') {
                $body .= "Variações:\n{$variationLines}";
            }

            $from = $_ENV['SMTP_FROM'] ?? 'no-reply@localhost';
            @mail($to, $subject, $body, "From: {$from}\r\nReply-To: {$email}");
        }

        return $this->json($response, ['ok' => true]);
    }

    private function json(ResponseInterface $response, array $payload, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}
