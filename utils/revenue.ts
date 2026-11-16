import { BookingStatus } from '../types';

export interface RevenueBookingInput {
  status?: string | BookingStatus | null;
  totalPrice?: number | string | null;
  price?: number | string | null;
  depositAmount?: number | string | null;
  balanceDue?: number | string | null;
  bookingTier?: string | null;
}

function toSafeAmount(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }
  return 0;
}

function getFullPrice(booking?: RevenueBookingInput | null): number {
  if (!booking) return 0;
  if (booking.totalPrice !== undefined && booking.totalPrice !== null) {
    const total = toSafeAmount(booking.totalPrice);
    if (total > 0) return total;
  }
  return toSafeAmount(booking.price);
}

/**
 * Collected revenue per booking:
 * - CONFIRMED, CHECKED_IN, COMPLETED = full price (totalPrice, falling back to price)
 * - DEPOSIT_PAID = depositAmount only
 * - All other statuses = 0
 */
export function getCollectedAmount(booking?: RevenueBookingInput | null): number {
  if (!booking) return 0;
  const status = String(booking.status || '').toUpperCase();

  if (
    status === BookingStatus.CONFIRMED ||
    status === BookingStatus.CHECKED_IN ||
    status === BookingStatus.COMPLETED
  ) {
    return getFullPrice(booking);
  }

  if (status === BookingStatus.DEPOSIT_PAID) {
    return toSafeAmount(booking.depositAmount);
  }

  return 0;
}

/**
 * Informational outstanding balance (not revenue):
 * - DEPOSIT_PAID = balanceDue if present, else full price minus depositAmount
 * - All other statuses = 0
 */
export function getOutstandingBalance(booking?: RevenueBookingInput | null): number {
  if (!booking) return 0;
  const status = String(booking.status || '').toUpperCase();

  if (status !== BookingStatus.DEPOSIT_PAID) {
    return 0;
  }

  if (booking.balanceDue !== undefined && booking.balanceDue !== null && booking.balanceDue !== '') {
    const parsed = Number(booking.balanceDue);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  const fullPrice = getFullPrice(booking);
  const deposit = toSafeAmount(booking.depositAmount);
  return Math.max(0, fullPrice - deposit);
}

/**
 * Pending verification amount:
 * - PAYMENT_SUBMITTED only = depositAmount if bookingTier === 'DEPOSIT', otherwise full price
 * - All other statuses = 0
 */
export function getPendingVerificationAmount(booking?: RevenueBookingInput | null): number {
  if (!booking) return 0;
  const status = String(booking.status || '').toUpperCase();

  if (status !== BookingStatus.PAYMENT_SUBMITTED) {
    return 0;
  }

  if (String(booking.bookingTier || '').toUpperCase() === 'DEPOSIT') {
    return toSafeAmount(booking.depositAmount);
  }

  return getFullPrice(booking);
}
