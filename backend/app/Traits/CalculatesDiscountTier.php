<?php

namespace App\Traits;

trait CalculatesDiscountTier
{
    /**
     * Calculate discount_tier_item for each item in a transaction.
     * Fish items: proportional share of discount_tier based on subtotal.
     * Last fish item gets the remainder to avoid rounding drift.
     * Non-fish items: 0.
     */
    public function calculateDiscountTierItems(array $items, float $discountTier): array
    {
        $fishItems    = [];
        $nonFishItems = [];

        foreach ($items as $item) {
            if ($item['item_type'] === 'fish') {
                $fishItems[] = $item;
            } else {
                $nonFishItems[] = $item;
            }
        }

        $totalFishSubtotal = array_sum(array_column($fishItems, 'subtotal'));

        $result         = [];
        $allocatedSoFar = 0;

        foreach ($fishItems as $index => $fishItem) {
            $isLast = ($index === count($fishItems) - 1);

            if ($totalFishSubtotal > 0 && !$isLast) {
                $share = round($fishItem['subtotal'] / $totalFishSubtotal * $discountTier, 2);
                $allocatedSoFar += $share;
            } elseif ($totalFishSubtotal > 0 && $isLast) {
                // Last fish item gets the remainder
                $share = round($discountTier - $allocatedSoFar, 2);
            } else {
                $share = 0;
            }

            $fishItem['discount_tier_item'] = $share;
            $result[] = $fishItem;
        }

        foreach ($nonFishItems as $nonFishItem) {
            $nonFishItem['discount_tier_item'] = 0;
            $result[] = $nonFishItem;
        }

        return $result;
    }
}
