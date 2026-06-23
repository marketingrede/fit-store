<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Repositories\EmployeeEligibilityRepository;
use App\Repositories\EmployeeRepository;
use App\Repositories\FitcWalletRepository;
use App\Repositories\FitcLedgerRepository;
use App\Repositories\TradeOrderRepository;
use App\Support\Csrf;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Views\Twig;

final class EmployeeManagementController
{
    public function __construct(
        private readonly Twig $view,
        private readonly EmployeeEligibilityRepository $eligibilityRepo,
        private readonly EmployeeRepository $employeeRepo,
        private readonly FitcWalletRepository $walletRepo,
        private readonly FitcLedgerRepository $ledgerRepo,
        private readonly TradeOrderRepository $tradeOrderRepo,
    ) {
    }

    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $stats = [
            'total_eligible' => $this->eligibilityRepo->count(),
            'active_eligible' => $this->eligibilityRepo->countActive(),
            'registered' => $this->eligibilityRepo->countRegistered(),
            'total_employees' => $this->employeeRepo->count(),
            'total_balance' => $this->walletRepo->totalBalance(),
            'total_orders' => $this->tradeOrderRepo->count(),
        ];

        return $this->view->render($response, 'admin/employees/index.twig', [
            'active_nav' => 'employees',
            'stats' => $stats,
        ]);
    }

    public function eligibleList(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $employees = $this->eligibilityRepo->all();

        return $this->view->render($response, 'admin/employees/eligible.twig', [
            'active_nav' => 'employees_eligible',
            'employees' => $employees,
        ]);
    }

    public function eligibleCreateForm(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->view->render($response, 'admin/employees/eligible_form.twig', [
            'active_nav' => 'employees_eligible',
            'employee' => null,
            'error' => null,
        ]);
    }

    public function eligibleStore(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody() ?? [];

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $response->withHeader('Location', '/admin/colaboradores/elegiveis')->withStatus(302);
        }

        $employeeId = trim((string) ($data['employee_id'] ?? ''));
        $fullName = trim((string) ($data['full_name'] ?? ''));
        $email = trim((string) ($data['email'] ?? ''));
        $department = trim((string) ($data['department'] ?? ''));
        $initialBalance = (int) ($data['initial_balance_fitc'] ?? 0);

        if ($employeeId === '' || $fullName === '') {
            $employees = $this->eligibilityRepo->all();
            return $this->view->render($response->withStatus(422), 'admin/employees/eligible.twig', [
                'active_nav' => 'employees_eligible',
                'employees' => $employees,
                'error' => 'Matrícula e nome são obrigatórios.',
            ]);
        }

        $existing = $this->eligibilityRepo->findByEmployeeId($employeeId);
        if ($existing) {
            $employees = $this->eligibilityRepo->all();
            return $this->view->render($response->withStatus(409), 'admin/employees/eligible.twig', [
                'active_nav' => 'employees_eligible',
                'employees' => $employees,
                'error' => 'Já existe um registro com esta matrícula.',
            ]);
        }

        $this->eligibilityRepo->create([
            'employee_id' => $employeeId,
            'full_name' => $fullName,
            'email' => $email ?: null,
            'department' => $department ?: null,
            'status' => 'active',
            'initial_balance_fitc' => $initialBalance,
            'notes' => null,
        ]);

        return $response->withHeader('Location', '/admin/colaboradores/elegiveis')->withStatus(302);
    }

    public function eligibleEditForm(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int) $args['id'];
        $employee = $this->eligibilityRepo->findById($id);

        if (!$employee) {
            return $response->withHeader('Location', '/admin/colaboradores/elegiveis')->withStatus(302);
        }

        return $this->view->render($response, 'admin/employees/eligible_form.twig', [
            'active_nav' => 'employees_eligible',
            'employee' => $employee,
            'error' => null,
        ]);
    }

    public function eligibleUpdate(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int) $args['id'];
        $data = $request->getParsedBody() ?? [];

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $response->withHeader('Location', '/admin/colaboradores/elegiveis')->withStatus(302);
        }

        $fullName = trim((string) ($data['full_name'] ?? ''));
        $email = trim((string) ($data['email'] ?? ''));
        $department = trim((string) ($data['department'] ?? ''));
        $status = (string) ($data['status'] ?? 'active');
        $initialBalance = (int) ($data['initial_balance_fitc'] ?? 0);

        if ($fullName === '') {
            $employee = $this->eligibilityRepo->findById($id);
            return $this->view->render($response->withStatus(422), 'admin/employees/eligible_form.twig', [
                'active_nav' => 'employees_eligible',
                'employee' => $employee,
                'error' => 'Nome é obrigatório.',
            ]);
        }

        $this->eligibilityRepo->update($id, [
            'full_name' => $fullName,
            'email' => $email ?: null,
            'department' => $department ?: null,
            'status' => $status,
            'initial_balance_fitc' => $initialBalance,
            'notes' => $data['notes'] ?? null,
        ]);

        return $response->withHeader('Location', '/admin/colaboradores/elegiveis')->withStatus(302);
    }

    public function eligibleDelete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int) $args['id'];
        $data = $request->getParsedBody() ?? [];

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $response->withHeader('Location', '/admin/colaboradores/elegiveis')->withStatus(302);
        }

        $this->eligibilityRepo->delete($id);

        return $response->withHeader('Location', '/admin/colaboradores/elegiveis')->withStatus(302);
    }

    public function employeeList(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $employees = $this->employeeRepo->all();
        $wallets = [];
        foreach ($employees as $emp) {
            $wallets[$emp['id']] = $this->walletRepo->getBalance($emp['id']);
        }

        return $this->view->render($response, 'admin/employees/list.twig', [
            'active_nav' => 'employees_list',
            'employees' => $employees,
            'wallets' => $wallets,
        ]);
    }

    public function employeeDetail(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int) $args['id'];
        $employee = $this->employeeRepo->findById($id);

        if (!$employee) {
            return $response->withHeader('Location', '/admin/colaboradores/contas')->withStatus(302);
        }

        $balance = $this->walletRepo->getBalance($id);
        $ledger = $this->ledgerRepo->findByEmployeeId($id, 50);
        $orders = $this->tradeOrderRepo->findByEmployeeId($id, 50);

        return $this->view->render($response, 'admin/employees/detail.twig', [
            'active_nav' => 'employees_list',
            'employee' => $employee,
            'balance' => $balance,
            'ledger' => $ledger,
            'orders' => $orders,
        ]);
    }

    public function employeeDelete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int) $args['id'];
        $data = $request->getParsedBody() ?? [];

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $response->withHeader('Location', '/admin/colaboradores/contas')->withStatus(302);
        }

        $this->employeeRepo->delete($id);

        return $response->withHeader('Location', '/admin/colaboradores/contas')->withStatus(302);
    }

    public function balances(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $employees = $this->employeeRepo->all();
        $wallets = [];
        foreach ($employees as $emp) {
            $wallets[$emp['id']] = $this->walletRepo->getBalance($emp['id']);
        }

        return $this->view->render($response, 'admin/employees/balances.twig', [
            'active_nav' => 'employees_balances',
            'employees' => $employees,
            'wallets' => $wallets,
        ]);
    }

    public function balanceAdjust(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int) $args['id'];
        $data = $request->getParsedBody() ?? [];

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $response->withHeader('Location', '/admin/colaboradores/saldos')->withStatus(302);
        }

        $type = (string) ($data['type'] ?? 'credit');
        $amount = (int) ($data['amount'] ?? 0);
        $description = trim((string) ($data['description'] ?? ''));

        if ($amount <= 0) {
            return $response->withHeader('Location', '/admin/colaboradores/saldos')->withStatus(302);
        }

        $employee = $this->employeeRepo->findById($id);
        if (!$employee) {
            return $response->withHeader('Location', '/admin/colaboradores/saldos')->withStatus(302);
        }

        $currentBalance = $this->walletRepo->getBalance($id);
        $adminUserId = $_SESSION['user_id'] ?? null;

        if ($type === 'credit') {
            $newBalance = $this->walletRepo->credit($id, $amount);
            $this->ledgerRepo->create([
                'employee_id' => $id,
                'type' => 'credit',
                'amount_fitc' => $amount,
                'balance_after_fitc' => $newBalance,
                'reference_type' => 'manual_adjustment',
                'reference_id' => null,
                'description' => $description ?: 'Crédito manual pelo administrador',
                'created_by_user_id' => $adminUserId,
            ]);
        } elseif ($type === 'debit' && $currentBalance >= $amount) {
            $newBalance = $this->walletRepo->debit($id, $amount);
            $this->ledgerRepo->create([
                'employee_id' => $id,
                'type' => 'debit',
                'amount_fitc' => $amount,
                'balance_after_fitc' => $newBalance,
                'reference_type' => 'manual_adjustment',
                'reference_id' => null,
                'description' => $description ?: 'Débito manual pelo administrador',
                'created_by_user_id' => $adminUserId,
            ]);
        }

        return $response->withHeader('Location', '/admin/colaboradores/saldos')->withStatus(302);
    }

    public function ordersList(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $orders = $this->tradeOrderRepo->all(200);

        $employeeNames = [];
        foreach ($orders as $order) {
            if (!isset($employeeNames[$order['employee_id']])) {
                $emp = $this->employeeRepo->findById($order['employee_id']);
                $employeeNames[$order['employee_id']] = $emp ? $emp['full_name'] : 'Desconhecido';
            }
        }

        return $this->view->render($response, 'admin/employees/orders.twig', [
            'active_nav' => 'employees_orders',
            'orders' => $orders,
            'employee_names' => $employeeNames,
        ]);
    }

    public function orderUpdateStatus(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $id = (int) $args['id'];
        $data = $request->getParsedBody() ?? [];

        if (!Csrf::validate($data['_csrf'] ?? null)) {
            return $response->withHeader('Location', '/admin/colaboradores/pedidos')->withStatus(302);
        }

        $status = (string) ($data['status'] ?? 'confirmed');
        $notes = $data['fulfillment_notes'] ?? null;

        $this->tradeOrderRepo->updateStatus($id, $status, $notes);

        return $response->withHeader('Location', '/admin/colaboradores/pedidos')->withStatus(302);
    }
}
