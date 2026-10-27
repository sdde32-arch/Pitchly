/**
 * Pricing utility functions for pitch reservations and deposits.
 */

export interface DepositCalculation {
  depositAmount: number;
  balanceDue: number;
  isFull: boolean;
}

/**
 * Computes required deposit and balance due for a booking.
 * 
 * @param totalPrice Total booking price in UGX
 * @param depositPercentage Optional owner-configured deposit percentage (1-100, default 50)
 * @returns { depositAmount, balanceDue, isFull }
 */
export function computeDeposit(totalPrice: number, depositPercentage?: number): DepositCalculation {
  const safeTotal = typeof totalPrice === 'number' && !isNaN(totalPrice) ? Math.max(0, totalPrice) : 0;
  
  // Valid percentage = a number from 1 to 100, otherwise use 50
  const pct = (typeof depositPercentage === 'number' && !isNaN(depositPercentage) && depositPercentage >= 1 && depositPercentage <= 100)
    ? depositPercentage
    : 50;

  // depositAmount = totalPrice * pct / 100 rounded to the nearest 1000 UGX
  const raw = (safeTotal * pct) / 100;
  const rounded1000 = Math.round(raw / 1000) * 1000;
  
  // if that rounds to 0 use the plain rounded integer; never more than totalPrice; NO minimum floor
  let depositAmount = rounded1000 === 0 ? Math.round(raw) : rounded1000;
  depositAmount = Math.min(safeTotal, depositAmount);

  // isFull = pct >= 100 or depositAmount >= totalPrice (then depositAmount = totalPrice, balanceDue = 0)
  const isFull = pct >= 100 || depositAmount >= safeTotal;
  if (isFull) {
    return {
      depositAmount: safeTotal,
      balanceDue: 0,
      isFull: true
    };
  }

  const balanceDue = Math.max(0, safeTotal - depositAmount);
  return {
    depositAmount,
    balanceDue,
    isFull: false
  };
}
