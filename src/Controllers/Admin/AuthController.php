<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Database\Database;
use App\Support\Csrf;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Views\Twig;

final class AuthController
{
    private const MAX_ATTEMPTS = 5;
    private const LOCKOUT_SECONDS = 900;

    public function __construct(
        private readonly Twig $view,
        private readonly Database $database,
    ) {
    }

    public function loginForm(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        if (!empty($_SESSION['user_id'])) {
            return $response->withHeader('Location', '/admin')->withStatus(302);
        }

        return $this->view->render($response, 'admin/login.twig', [
            'error' => null,
        ]);
    }

    public function login(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody() ?? [];

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->view->render($response, 'admin/login.twig', [
                'error' => 'Sessão expirada. Tente novamente.',
            ]);
        }

        if ($this->isLockedOut()) {
            return $this->view->render($response->withStatus(429), 'admin/login.twig', [
                'error' => 'Muitas tentativas. Aguarde 15 minutos e tente novamente.',
            ]);
        }

        $email = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        $stmt = $this->database->pdo()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            $this->registerFailedAttempt();

            return $this->view->render($response->withStatus(401), 'admin/login.twig', [
                'error' => 'E-mail ou senha incorretos.',
            ]);
        }

        unset($_SESSION['login_attempts'], $_SESSION['login_locked_until']);
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];

        return $response->withHeader('Location', '/admin')->withStatus(302);
    }

    public function logout(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }

        return $response->withHeader('Location', '/admin/login')->withStatus(302);
    }

    private function isLockedOut(): bool
    {
        $until = (int) ($_SESSION['login_locked_until'] ?? 0);

        return $until > time();
    }

    private function registerFailedAttempt(): void
    {
        $attempts = (int) ($_SESSION['login_attempts'] ?? 0) + 1;
        $_SESSION['login_attempts'] = $attempts;

        if ($attempts >= self::MAX_ATTEMPTS) {
            $_SESSION['login_locked_until'] = time() + self::LOCKOUT_SECONDS;
            $_SESSION['login_attempts'] = 0;
        }
    }
}
