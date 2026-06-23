<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\FitcWalletRepository;
use App\Repositories\FitcLedgerRepository;
use App\Repositories\TradeOrderRepository;
use App\Repositories\ProductRepository;
use App\Repositories\ProductVariationRepository;
use App\Support\ProductVariationValidator;

final class TradeService
{
    public function __construct(
        private readonly ProductRepository $productRepo,
        private readonly ProductVariationRepository $variationRepo,
        private readonly FitcWalletRepository $walletRepo,
        private readonly FitcLedgerRepository $ledgerRepo,
        private readonly TradeOrderRepository $tradeOrderRepo,
    ) {
    }

    /**
     * @return array{ok: bool, order_id?: int, new_balance?: int, error?: string}
     */
    public function processTrade(int $employeeId, int $productId, array $selection): array
    {
        $product = $this->productRepo->findById($productId);
        if (!$product || !$product['active']) {
            return ['ok' => false, 'error' => 'Produto não encontrado ou inativo.'];
        }

        $validation = ProductVariationValidator::validate($product, $selection, $this->variationRepo);
        if (!$validation['valid']) {
            return ['ok' => false, 'error' => $validation['error']];
        }

        $finalPrice = $validation['final_price'];

        $pdo = $this->getPdo();
        $pdo->exec('BEGIN IMMEDIATE');

        try {
            $currentBalance = $this->walletRepo->getBalance($employeeId);
            if ($currentBalance < $finalPrice) {
                $pdo->exec('ROLLBACK');
                return ['ok' => false, 'error' => 'Saldo insuficiente. Seu saldo: ' . $currentBalance . ' FITC.'];
            }

            $newBalance = $this->walletRepo->debit($employeeId, $finalPrice);

            $ledgerId = $this->ledgerRepo->create([
                'employee_id' => $employeeId,
                'type' => 'debit',
                'amount_fitc' => $finalPrice,
                'balance_after_fitc' => $newBalance,
                'reference_type' => 'trade_order',
                'reference_id' => null,
                'description' => 'Resgate: ' . $product['name'],
                'created_by_user_id' => null,
            ]);

            $orderId = $this->tradeOrderRepo->create([
                'employee_id' => $employeeId,
                'product_id' => $productId,
                'product_name' => $product['name'],
                'product_price_fitc' => $finalPrice,
                'product_selection_json' => json_encode($selection),
                'status' => 'confirmed',
                'ledger_debit_id' => $ledgerId,
            ]);

            $pdo->exec('COMMIT');

            return ['ok' => true, 'order_id' => $orderId, 'new_balance' => $newBalance];
        } catch (\Exception $e) {
            $pdo->exec('ROLLBACK');
            return ['ok' => false, 'error' => 'Erro ao processar resgate.'];
        }
    }

    private function getPdo(): \PDO
    {
        $reflection = new \ReflectionProperty($this->walletRepo, 'database');
        $reflection->setAccessible(true);
        $database = $reflection->getValue($this->walletRepo);

        return $database->pdo();
    }
}
