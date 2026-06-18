<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\ProductRepository;
use App\Support\Spa;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Views\Twig;

final class ProductController
{
    public function __construct(
        private readonly Twig $view,
        private readonly ProductRepository $products,
        private readonly HomeController $home,
    ) {
    }

    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $product = $this->products->find((int) $args['id']);

        if (!$product) {
            if (Spa::isPartial($request)) {
                $response->getBody()->write('<p class="empty-state">Produto não encontrado.</p>');

                return $response->withStatus(404)->withHeader('X-Page-Type', 'error');
            }

            return $this->view->render($response->withStatus(404), 'errors/404.twig');
        }

        $data = $this->home->buildPageData($request);
        $title = $product['name'] . ' | Fit Store';

        if (Spa::isPartial($request)) {
            return $this->view->render($response, 'public/partials/home.twig', $data)
                ->withHeader('X-Page-Title', $title)
                ->withHeader('X-Page-Type', 'home');
        }

        $data['document_title'] = $title;

        return $this->view->render($response, 'public/home.twig', $data);
    }
}
