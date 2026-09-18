export const USER_SPEND_CAP_USD = 0.25;

export function remainingSpendUsd(spentUsd: number): number {
  const remaining = USER_SPEND_CAP_USD - spentUsd;
  return remaining > 0 ? remaining : 0;
}

export function isOverSpendCap(spentUsd: number): boolean {
  return spentUsd >= USER_SPEND_CAP_USD;
}
