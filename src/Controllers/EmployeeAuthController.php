<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\EmployeeEligibilityRepository;
use App\Repositories\EmployeeRepository;
use App\Repositories\FitcLedgerRepository;
use App\Repositories\FitcWalletRepository;
use App\Support\Csrf;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Views\Twig;

final class EmployeeAuthController
{
    private const MAX_ATTEMPTS = 5;
    private const LOCKOUT_SECONDS = 900;

    public function __construct(
        private readonly Twig $view,
        private readonly EmployeeEligibilityRepository $eligibilityRepo,
        private readonly EmployeeRepository $employeeRepo,
        private readonly FitcWalletRepository $walletRepo,
        private readonly FitcLedgerRepository $ledgerRepo,
    ) {
    }

    public function loginForm(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        if (!empty($_SESSION['employee_id'])) {
            return $response->withHeader('Location', '/colaborador')->withStatus(302);
        }

        return $this->view->render($response, 'employee/login.twig', [
            'error' => null,
        ]);
    }

    public function login(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody() ?? [];

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->view->render($response, 'employee/login.twig', [
                'error' => 'Sessão expirada. Tente novamente.',
            ]);
        }

        if ($this->isLockedOut()) {
            return $this->view->render($response->withStatus(429), 'employee/login.twig', [
                'error' => 'Muitas tentativas. Aguarde 15 minutos e tente novamente.',
            ]);
        }

        $employeeId = trim((string) ($data['employee_id'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        $employee = $this->employeeRepo->findByEmployeeId($employeeId);

        if (!$employee || !password_verify($password, $employee['password_hash'])) {
            $this->registerFailedAttempt();

            return $this->view->render($response->withStatus(401), 'employee/login.twig', [
                'error' => 'Matrícula ou senha incorretos.',
            ]);
        }

        unset($_SESSION['emp_login_attempts'], $_SESSION['emp_login_locked_until']);
        session_regenerate_id(true);
        $_SESSION['employee_id'] = $employee['id'];
        $_SESSION['employee_matricula'] = $employee['employee_id'];
        $_SESSION['employee_name'] = $employee['full_name'];

        $this->employeeRepo->updateLastLogin($employee['id']);

        return $response->withHeader('Location', '/colaborador')->withStatus(302);
    }

    public function logout(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        unset($_SESSION['employee_id'], $_SESSION['employee_matricula'], $_SESSION['employee_name']);
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }

        return $response->withHeader('Location', '/colaborador/login')->withStatus(302);
    }

    public function registerForm(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        if (!empty($_SESSION['employee_id'])) {
            return $response->withHeader('Location', '/colaborador')->withStatus(302);
        }

        return $this->view->render($response, 'employee/register.twig', [
            'error' => null,
            'success' => null,
        ]);
    }

    public function register(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody() ?? [];

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $this->view->render($response, 'employee/register.twig', [
                'error' => 'Sessão expirada. Tente novamente.',
                'success' => null,
            ]);
        }

        $employeeId = trim((string) ($data['employee_id'] ?? ''));
        $email = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');
        $passwordConfirm = (string) ($data['password_confirm'] ?? '');

        if ($employeeId === '' || $email === '' || $password === '') {
            return $this->view->render($response, 'employee/register.twig', [
                'error' => 'Preencha todos os campos.',
                'success' => null,
            ]);
        }

        if ($password !== $passwordConfirm) {
            return $this->view->render($response, 'employee/register.twig', [
                'error' => 'As senhas não coincidem.',
                'success' => null,
            ]);
        }

        if (strlen($password) < 8) {
            return $this->view->render($response, 'employee/register.twig', [
                'error' => 'A senha deve ter no mínimo 8 caracteres.',
                'success' => null,
            ]);
        }

        $eligibility = $this->eligibilityRepo->findByEmployeeId($employeeId);

        if (!$eligibility || $eligibility['status'] !== 'active') {
            return $this->view->render($response->withStatus(403), 'employee/register.twig', [
                'error' => 'Matrícula não autorizada para cadastro.',
                'success' => null,
            ]);
        }

        if ($this->employeeRepo->findByEmployeeId($employeeId)) {
            return $this->view->render($response->withStatus(409), 'employee/register.twig', [
                'error' => 'Esta matrícula já possui uma conta cadastrada.',
                'success' => null,
            ]);
        }

        $existingByEmail = $this->employeeRepo->findByEmail($email);
        if ($existingByEmail) {
            return $this->view->render($response->withStatus(409), 'employee/register.twig', [
                'error' => 'Este e-mail já está em uso.',
                'success' => null,
            ]);
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $employeeDbId = $this->employeeRepo->create([
            'eligibility_id' => $eligibility['id'],
            'employee_id' => $employeeId,
            'email' => $email,
            'password_hash' => $passwordHash,
            'full_name' => $eligibility['full_name'],
        ]);

        $this->walletRepo->create($employeeDbId, $eligibility['initial_balance_fitc']);

        if ($eligibility['initial_balance_fitc'] > 0) {
            $this->ledgerRepo->create([
                'employee_id' => $employeeDbId,
                'type' => 'credit',
                'amount_fitc' => $eligibility['initial_balance_fitc'],
                'balance_after_fitc' => $eligibility['initial_balance_fitc'],
                'reference_type' => 'registration',
                'reference_id' => null,
                'description' => 'Saldo inicial na ativação da conta',
                'created_by_user_id' => null,
            ]);
        }

        $this->eligibilityRepo->markRegistered($eligibility['id']);

        return $this->view->render($response, 'employee/register.twig', [
            'error' => null,
            'success' => 'Conta criada com sucesso! Faça login para acessar.',
        ]);
    }

    private function isLockedOut(): bool
    {
        $until = (int) ($_SESSION['emp_login_locked_until'] ?? 0);

        return $until > time();
    }

    private function registerFailedAttempt(): void
    {
        $attempts = (int) ($_SESSION['emp_login_attempts'] ?? 0) + 1;
        $_SESSION['emp_login_attempts'] = $attempts;

        if ($attempts >= self::MAX_ATTEMPTS) {
            $_SESSION['emp_login_locked_until'] = time() + self::LOCKOUT_SECONDS;
            $_SESSION['emp_login_attempts'] = 0;
        }
    }
}
