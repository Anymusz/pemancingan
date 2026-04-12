<?php

namespace App\Exports;

use App\Traits\CalculatesDiscountTier;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class TransactionReportExport implements FromCollection, WithHeadings
{
    use CalculatesDiscountTier;

    public function __construct(
        private $transactions,
        private Carbon $start,
        private Carbon $end
    ) {}

    public function headings(): array
    {
        return [
            'Tanggal',
            'No_Transaksi',
            'Pelanggan',
            'Tipe',
            'Item',
            'Qty',
            'Harga_Satuan',
            'Subtotal',
            'Diskon_Tier_Item',
            'Subtotal_Setelah_Diskon_Tier',
            'Diskon_Voucher_Transaksi',
            'Poin',
            'Tips',
            'Metode_Bayar',
            'Deposit',
        ];
    }

    public function collection()
    {
        $rows = [];

        foreach ($this->transactions as $trx) {
            $items = $trx->items->map(fn ($i) => $i->toArray())->toArray();
            $items = $this->calculateDiscountTierItems($items, (float) $trx->discount_tier);

            $customerName    = $trx->arrival?->display_name ?? '-';
            $isGuest         = is_null($trx->arrival?->member_id);
            $customerType    = $isGuest ? 'Tamu' : 'Member';
            $depositAmount   = $isGuest ? (float) ($trx->arrival?->deposit_amount ?? 0) : '';
            $discountVoucher = (float) $trx->discount_voucher;

            foreach ($items as $index => $item) {
                $isFirstRow                = $index === 0;
                $discountTierItem          = (float) $item['discount_tier_item'];
                $subtotalAfterDiscountTier = round((float) $item['subtotal'] - $discountTierItem, 2);

                $rows[] = [
                    $trx->transaction_date->format('Y-m-d H:i:s'),
                    $trx->transaction_code,
                    $customerName,
                    $customerType,
                    $item['item_name_snapshot'],
                    (float) $item['quantity'],
                    (float) $item['unit_price_snapshot'],
                    (float) $item['subtotal'],
                    $discountTierItem,
                    $subtotalAfterDiscountTier,
                    $isFirstRow ? $discountVoucher : '',
                    $isFirstRow ? $trx->points_earned : '',
                    $isFirstRow ? (float) $trx->tips : '',
                    $isFirstRow ? ($trx->payment_method ?? 'deposit') : '',
                    $isFirstRow ? $depositAmount : '',
                ];
            }
        }

        return collect($rows);
    }
}