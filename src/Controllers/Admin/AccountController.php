<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Database\Database;
use App\Support\Csrf;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Views\Twig;

final class AccountController
{
    public function __construct(
        private readonly Twig $view,
        private readonly Database $database,
    ) {
    }

    private function renderAccount(ResponseInterface $response, ?string $error, ?string $success): ResponseInterface
    {
        return $this->view->render($response, 'admin/account.twig', [
            'error' => $error,
            'success' => $success,
            'user_email' => $_SESSION['user_email'] ?? '',
            'active_nav' => 'account',
        ]);
    }

    public function form(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->renderAccount($response, null, null);
    }

    public function updatePassword(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody() ?? [];

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->renderAccount($response, 'Sessão expirada.', null);
        }

        $current = (string) ($data['current_password'] ?? '');
        $new = (string) ($data['new_password'] ?? '');
        $confirm = (string) ($data['confirm_password'] ?? '');

        if (strlen($new) < 8) {
            return $this->renderAccount($response, 'A nova senha deve ter pelo menos 8 caracteres.', null);
        }

        if ($new !== $confirm) {
            return $this->renderAccount($response, 'A confirmação não confere.', null);
        }

        $stmt = $this->database->pdo()->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$_SESSION['user_id'] ?? 0]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($current, $user['password_hash'])) {
            return $this->renderAccount($response, 'Senha atual incorreta.', null);
        }

        $this->database->pdo()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            ->execute([password_hash($new, PASSWORD_BCRYPT), $user['id']]);

        return $this->renderAccount($response, null, 'Senha alterada com sucesso.');
    }
}
