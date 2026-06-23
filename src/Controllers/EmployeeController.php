<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\EmployeeRepository;
use App\Repositories\FitcLedgerRepository;
use App\Repositories\FitcWalletRepository;
use App\Repositories\TradeOrderRepository;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Views\Twig;

final class EmployeeController
{
    public function __construct(
        private readonly Twig $view,
        private readonly EmployeeRepository $employeeRepo,
        private readonly FitcWalletRepository $walletRepo,
        private readonly FitcLedgerRepository $ledgerRepo,
        private readonly TradeOrderRepository $tradeOrderRepo,
    ) {
    }

    public function profile(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $employeeId = $_SESSION['employee_id'] ?? 0;
        $employee = $this->employeeRepo->findById($employeeId);

        if (!$employee) {
            return $response->withHeader('Location', '/colaborador/login')->withStatus(302);
        }

        $balance = $this->walletRepo->getBalance($employeeId);
        $totalOrders = $this->tradeOrderRepo->countByEmployeeId($employeeId);
        $totalLedgerEntries = $this->ledgerRepo->countByEmployeeId($employeeId);

        return $this->view->render($response, 'employee/profile.twig', [
            'employee' => $employee,
            'balance' => $balance,
            'total_orders' => $totalOrders,
            'total_ledger_entries' => $totalLedgerEntries,
        ]);
    }

    public function statement(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $employeeId = $_SESSION['employee_id'] ?? 0;
        $employee = $this->employeeRepo->findById($employeeId);

        if (!$employee) {
            return $response->withHeader('Location', '/colaborador/login')->withStatus(302);
        }

        $balance = $this->walletRepo->getBalance($employeeId);
        $entries = $this->ledgerRepo->findByEmployeeId($employeeId, 100);

        return $this->view->render($response, 'employee/statement.twig', [
            'employee' => $employee,
            'balance' => $balance,
            'entries' => $entries,
        ]);
    }

    public function orders(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $employeeId = $_SESSION['employee_id'] ?? 0;
        $employee = $this->employeeRepo->findById($employeeId);

        if (!$employee) {
            return $response->withHeader('Location', '/colaborador/login')->withStatus(302);
        }

        $balance = $this->walletRepo->getBalance($employeeId);
        $orders = $this->tradeOrderRepo->findByEmployeeId($employeeId, 50);

        return $this->view->render($response, 'employee/orders.twig', [
            'employee' => $employee,
            'balance' => $balance,
            'orders' => $orders,
        ]);
    }
}
