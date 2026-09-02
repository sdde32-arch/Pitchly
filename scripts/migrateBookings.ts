import { db } from "../lib/firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { BookingStatus, PaymentMethod } from "../types";

/**
 * Normalization maps for legacy lowercase or inconsistent booking statuses and payment methods.
 */
const STATUS_MAP: Record<string, BookingStatus> = {
  "pending_payment": BookingStatus.PENDING_PAYMENT,
  "payment_submitted": BookingStatus.PAYMENT_SUBMITTED,
  "rejected": BookingStatus.REJECTED,
  "pending": BookingStatus.PENDING,
  "confirmed": BookingStatus.CONFIRMED,
  "cancelled": BookingStatus.CANCELLED,
  "completed": BookingStatus.COMPLETED,
  "disputed": BookingStatus.DISPUTED,
  "checked_in": BookingStatus.CHECKED_IN,
  "no_show": BookingStatus.NO_SHOW,
};

const PAYMENT_METHOD_MAP: Record<string, PaymentMethod> = {
  "cash": PaymentMethod.CASH,
  "mtn": PaymentMethod.MTN,
  "airtel": PaymentMethod.AIRTEL,
  "mobile_money": PaymentMethod.MOBILE_MONEY,
  "card": PaymentMethod.CARD,
};

/**
 * Migration routine to normalize all inconsistent bookings to strict uppercase enum schemas.
 * This prevents slot locks from failing to release due to casing mismatches.
 */
export async function migrateBookings(): Promise<{
  success: boolean;
  processed: number;
  updated: number;
  errors: string[];
}> {
  console.log("Starting bookings normalization migration...");
  const errors: string[] = [];
  let processed = 0;
  let updated = 0;

  try {
    const bookingsCol = collection(db, "bookings");
    const snapshot = await getDocs(bookingsCol);
    
    // Process in batches of 500 (Firestore transaction limits)
    let batch = writeBatch(db);
    let batchSize = 0;

    for (const docSnap of snapshot.docs) {
      processed++;
      const data = docSnap.data();
      const updates: Record<string, any> = {};

      // 1. Normalize Status Casing
      const currentStatus = data.status;
      if (currentStatus) {
        if (STATUS_MAP[currentStatus]) {
          updates.status = STATUS_MAP[currentStatus];
        } else if (typeof currentStatus === "string" && currentStatus !== currentStatus.toUpperCase()) {
          // Fallback capitalize
          updates.status = currentStatus.toUpperCase();
        }
      }

      // 2. Normalize Payment Method Casing
      const currentMethod = data.paymentMethod;
      if (currentMethod) {
        if (PAYMENT_METHOD_MAP[currentMethod]) {
          updates.paymentMethod = PAYMENT_METHOD_MAP[currentMethod];
        } else if (typeof currentMethod === "string" && currentMethod !== currentMethod.toUpperCase()) {
          updates.paymentMethod = currentMethod.toUpperCase();
        }
      }

      // If we have updates to perform for this document
      if (Object.keys(updates).length > 0) {
        const docRef = doc(db, "bookings", docSnap.id);
        batch.update(docRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        updated++;
        batchSize++;

        // Commit batch when it reaches 500 documents
        if (batchSize === 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchSize = 0;
        }
      }
    }

    // Commit any remaining updates
    if (batchSize > 0) {
      await batch.commit();
    }

    console.log(`Migration finished successfully. Processed ${processed} documents. Updated ${updated} documents.`);
    return { success: true, processed, updated, errors };
  } catch (error: any) {
    console.error("Migration failed:", error);
    errors.push(error?.message || String(error));
    return { success: false, processed, updated, errors };
  }
}
