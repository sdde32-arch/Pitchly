/**
 * Firestore Security Rules Test Suite for /slotAvailability, /slotLocks, and /slotNotes
 *
 * Covers:
 * - Suite A: Real application payloads & authorized access (ALLOW)
 * - Suite B: /slotAvailability abuse & schema boundaries (DENY)
 * - Suite C: /slotLocks hijack, overwrite, release & delete boundaries (DENY)
 * - Suite D: /slotNotes owner-private walk-in notes boundaries (DENY)
 */

import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import * as fs from "fs";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

interface TestCaseResult {
  id: string;
  suite: string;
  description: string;
  passed: boolean;
  error?: string;
}

const results: TestCaseResult[] = [];

async function recordTest(
  id: string,
  suite: string,
  description: string,
  fn: () => Promise<void>
) {
  try {
    await fn();
    results.push({ id, suite, description, passed: true });
    console.log(`  ${GREEN}✓ PASS${RESET} [${id}] ${description}`);
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    results.push({ id, suite, description, passed: false, error: errorMsg });
    console.log(`  ${RED}✗ FAIL${RESET} [${id}] ${description}`);
    console.log(`         Error: ${errorMsg}`);
  }
}

function printSuiteHeader(title: string) {
  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}${title}${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================${RESET}`);
}

const UID_O1 = "uid_owner_o1";
const UID_O2 = "uid_owner_o2";
const UID_A = "uid_player_a";
const UID_B = "uid_player_b";
const UID_C = "uid_player_c";
const UID_D = "uid_player_d";
const UID_ADMIN = "admin_user";

const PITCH_P1 = "pitch_p1";
const PITCH_P2 = "pitch_p2";
const TEST_DATE = "2026-11-20";

function makeSlotKey(pitchId: string, date: string, time: string): string {
  return `${pitchId}_${date}_${time}`.replace(/[\/\s—:]/g, "-");
}

async function runTestSuite() {
  const rules = fs.readFileSync("firestore.rules", "utf8");

  const testEnv: RulesTestEnvironment = await initializeTestEnvironment({
    projectId: "demo-footlink-security-test",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules,
    },
  });

  const nowMs = Date.now();
  const futureMs = nowMs + 2 * 60 * 60 * 1000;
  const expiredMs = nowMs - 30 * 60 * 1000;
  const oneYearMs = nowMs + 86400000 * 365;

  const nowIso = new Date(nowMs).toISOString();
  const futureIso = new Date(futureMs).toISOString();
  const expiredIso = new Date(expiredMs).toISOString();
  const oneYearIso = new Date(oneYearMs).toISOString();

  const SLOT_BA = makeSlotKey(PITCH_P1, TEST_DATE, "10:00");
  const SLOT_BC = makeSlotKey(PITCH_P1, TEST_DATE, "12:00");
  const SLOT_BLOCK = makeSlotKey(PITCH_P1, TEST_DATE, "14:00");
  const SLOT_BT_1 = makeSlotKey(PITCH_P1, TEST_DATE, "16:00");
  const SLOT_BT_2 = makeSlotKey(PITCH_P1, TEST_DATE, "17:00");
  const SLOT_BB_HELD = makeSlotKey(PITCH_P1, TEST_DATE, "22:00");
  const SLOT_BB_NO_MS = makeSlotKey(PITCH_P1, TEST_DATE, "23:00");
  const SLOT_BB_EXPIRED = makeSlotKey(PITCH_P1, TEST_DATE, "07:00");

  async function seedBaseFixtures() {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      // Users
      await setDoc(doc(db, `users/${UID_O1}`), { id: UID_O1, name: "Owner One", role: "OWNER", roles: ["OWNER", "PLAYER"] });
      await setDoc(doc(db, `users/${UID_O2}`), { id: UID_O2, name: "Owner Two", role: "OWNER", roles: ["OWNER", "PLAYER"] });
      await setDoc(doc(db, `users/${UID_A}`), { id: UID_A, name: "Player A", role: "PLAYER", roles: ["PLAYER"] });
      await setDoc(doc(db, `users/${UID_B}`), { id: UID_B, name: "Player B", role: "PLAYER", roles: ["PLAYER"] });
      await setDoc(doc(db, `users/${UID_C}`), { id: UID_C, name: "Player C", role: "PLAYER", roles: ["PLAYER"] });
      await setDoc(doc(db, `users/${UID_D}`), { id: UID_D, name: "Player D", role: "PLAYER", roles: ["PLAYER"] });
      await setDoc(doc(db, `users/${UID_ADMIN}`), { id: UID_ADMIN, name: "Platform Admin", role: "admin", roles: ["admin"] });

      // Pitches P1 (owner O1) and P2 (owner O2)
      await setDoc(doc(db, `pitches/${PITCH_P1}`), {
        id: PITCH_P1,
        ownerId: UID_O1,
        name: "Kampala Arena P1",
        status: "ACTIVE",
        pricePerHour: 120000,
        allowUnpaidReservations: true,
      });
      await setDoc(doc(db, `pitches/${PITCH_P2}`), {
        id: PITCH_P2,
        ownerId: UID_O2,
        name: "Ntinda Turf P2",
        status: "ACTIVE",
        pricePerHour: 100000,
        allowUnpaidReservations: true,
      });

      // Booking BA: PAYMENT_SUBMITTED, player A, lock active (expired), availability held
      await setDoc(doc(db, "bookings/booking_ba"), {
        id: "booking_ba",
        pitchId: PITCH_P1,
        ownerId: UID_O1,
        playerId: UID_A,
        userId: UID_A,
        date: TEST_DATE,
        time: "10:00",
        slots: ["10:00"],
        status: "PAYMENT_SUBMITTED",
        bookingTier: "FULL",
        paymentStatus: "SUBMITTED",
        paymentMethod: "MTN",
        transactionRef: "MTN123456",
        totalPrice: 120000,
        price: 120000,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      await setDoc(doc(db, `slotLocks/${SLOT_BA}`), {
        id: SLOT_BA,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "10:00",
        slots: ["10:00"],
        bookingId: "booking_ba",
        userId: UID_A,
        status: "active",
        tier: "FULL",
        createdAt: nowIso,
        expiresAt: expiredIso,
        expiresAtMs: expiredMs,
      });
      await setDoc(doc(db, `slotAvailability/${SLOT_BA}`), {
        id: SLOT_BA,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "10:00",
        status: "held",
        bookingTier: "FULL",
        bookingId: "booking_ba",
        expiresAt: expiredIso,
        updatedAt: nowIso,
      });

      // Booking BC: CONFIRMED, player C, lock active with EXPIRED expiresAt, availability booked
      await setDoc(doc(db, "bookings/booking_bc"), {
        id: "booking_bc",
        pitchId: PITCH_P1,
        ownerId: UID_O1,
        playerId: UID_C,
        userId: UID_C,
        date: TEST_DATE,
        time: "12:00",
        slots: ["12:00"],
        status: "CONFIRMED",
        bookingTier: "FULL",
        paymentStatus: "PAID",
        paymentMethod: "MTN",
        transactionRef: "MTN999888",
        totalPrice: 120000,
        price: 120000,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      await setDoc(doc(db, `slotLocks/${SLOT_BC}`), {
        id: SLOT_BC,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "12:00",
        slots: ["12:00"],
        bookingId: "booking_bc",
        userId: UID_C,
        status: "active",
        tier: "FULL",
        createdAt: nowIso,
        expiresAt: expiredIso,
        expiresAtMs: expiredMs,
      });
      await setDoc(doc(db, `slotAvailability/${SLOT_BC}`), {
        id: SLOT_BC,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "12:00",
        status: "booked",
        bookingTier: "FULL",
        bookingId: "booking_bc",
        expiresAt: expiredIso,
        updatedAt: nowIso,
      });

      // Owner block on P1 slot 14:00 (lock reason owner_block_*, availability blocked, private slotNote)
      await setDoc(doc(db, `slotLocks/${SLOT_BLOCK}`), {
        id: SLOT_BLOCK,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "14:00",
        userId: UID_O1,
        status: "active",
        reason: "owner_block_walk_in",
        createdAt: nowIso,
        expiresAt: oneYearIso,
        expiresAtMs: oneYearMs,
      });
      await setDoc(doc(db, `slotAvailability/${SLOT_BLOCK}`), {
        id: SLOT_BLOCK,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "14:00",
        status: "blocked",
        reason: "walk_in",
        blockReason: "WALK_IN",
        updatedAt: nowIso,
      });
      await setDoc(doc(db, `slotNotes/${SLOT_BLOCK}`), {
        id: SLOT_BLOCK,
        pitchId: PITCH_P1,
        ownerId: UID_O1,
        date: TEST_DATE,
        time: "14:00",
        blockReason: "WALK_IN",
        blockNote: "Kato Phone Booking",
        blockPhone: "+256772111222",
        updatedAt: nowIso,
      });

      // Booking BT: TENTATIVE, player D, 2 slots (16:00 and 17:00), lock tentative, availability tentative
      await setDoc(doc(db, "bookings/booking_bt"), {
        id: "booking_bt",
        pitchId: PITCH_P1,
        ownerId: UID_O1,
        playerId: UID_D,
        userId: UID_D,
        date: TEST_DATE,
        time: "16:00",
        slots: ["16:00", "17:00"],
        status: "TENTATIVE",
        bookingTier: "TENTATIVE",
        paymentStatus: "UNPAID",
        paymentMethod: "CASH",
        depositAmount: 0,
        balanceDue: 240000,
        totalPrice: 240000,
        price: 240000,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      for (const t of ["16:00", "17:00"]) {
        const key = makeSlotKey(PITCH_P1, TEST_DATE, t);
        await setDoc(doc(db, `slotLocks/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: t,
          slots: ["16:00", "17:00"],
          bookingId: "booking_bt",
          userId: UID_D,
          status: "tentative",
          tier: "TENTATIVE",
          createdAt: nowIso,
          expiresAt: futureIso,
          expiresAtMs: futureMs,
        });
        await setDoc(doc(db, `slotAvailability/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: t,
          status: "tentative",
          bookingTier: "TENTATIVE",
          bookingId: "booking_bt",
          expiresAt: futureIso,
          updatedAt: nowIso,
        });
      }

      // Booking BB_HELD: PENDING_PAYMENT DEPOSIT, player B, active unexpired lock WITH expiresAtMs, availability held
      await setDoc(doc(db, "bookings/booking_bb_held"), {
        id: "booking_bb_held",
        pitchId: PITCH_P1,
        ownerId: UID_O1,
        playerId: UID_B,
        userId: UID_B,
        date: TEST_DATE,
        time: "22:00",
        slots: ["22:00"],
        status: "PENDING_PAYMENT",
        bookingTier: "DEPOSIT",
        paymentStatus: "UNPAID",
        paymentMethod: "MTN",
        totalPrice: 120000,
        price: 120000,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      await setDoc(doc(db, `slotLocks/${SLOT_BB_HELD}`), {
        id: SLOT_BB_HELD,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "22:00",
        slots: ["22:00"],
        bookingId: "booking_bb_held",
        userId: UID_B,
        status: "active",
        tier: "DEPOSIT",
        createdAt: nowIso,
        expiresAt: futureIso,
        expiresAtMs: futureMs,
      });
      await setDoc(doc(db, `slotAvailability/${SLOT_BB_HELD}`), {
        id: SLOT_BB_HELD,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "22:00",
        status: "held",
        bookingTier: "DEPOSIT",
        bookingId: "booking_bb_held",
        expiresAt: futureIso,
        updatedAt: nowIso,
      });

      // Booking BB_NO_MS: PENDING_PAYMENT DEPOSIT, player B, active lock WITHOUT expiresAtMs (legacy lock)
      await setDoc(doc(db, "bookings/booking_bb_no_ms"), {
        id: "booking_bb_no_ms",
        pitchId: PITCH_P1,
        ownerId: UID_O1,
        playerId: UID_B,
        userId: UID_B,
        date: TEST_DATE,
        time: "23:00",
        slots: ["23:00"],
        status: "PENDING_PAYMENT",
        bookingTier: "DEPOSIT",
        paymentStatus: "UNPAID",
        paymentMethod: "MTN",
        totalPrice: 120000,
        price: 120000,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      await setDoc(doc(db, `slotLocks/${SLOT_BB_NO_MS}`), {
        id: SLOT_BB_NO_MS,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "23:00",
        slots: ["23:00"],
        bookingId: "booking_bb_no_ms",
        userId: UID_B,
        status: "active",
        tier: "DEPOSIT",
        createdAt: nowIso,
        expiresAt: futureIso,
      });
      await setDoc(doc(db, `slotAvailability/${SLOT_BB_NO_MS}`), {
        id: SLOT_BB_NO_MS,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "23:00",
        status: "held",
        bookingTier: "DEPOSIT",
        bookingId: "booking_bb_no_ms",
        expiresAt: futureIso,
        updatedAt: nowIso,
      });

      // Booking BB_EXPIRED: PENDING_PAYMENT DEPOSIT, player B, active lock past expiresAtMs, availability held
      await setDoc(doc(db, "bookings/booking_bb_expired"), {
        id: "booking_bb_expired",
        pitchId: PITCH_P1,
        ownerId: UID_O1,
        playerId: UID_B,
        userId: UID_B,
        date: TEST_DATE,
        time: "07:00",
        slots: ["07:00"],
        status: "PENDING_PAYMENT",
        bookingTier: "DEPOSIT",
        paymentStatus: "UNPAID",
        paymentMethod: "MTN",
        totalPrice: 120000,
        price: 120000,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      await setDoc(doc(db, `slotLocks/${SLOT_BB_EXPIRED}`), {
        id: SLOT_BB_EXPIRED,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "07:00",
        slots: ["07:00"],
        bookingId: "booking_bb_expired",
        userId: UID_B,
        status: "active",
        tier: "DEPOSIT",
        createdAt: nowIso,
        expiresAt: expiredIso,
        expiresAtMs: expiredMs,
      });
      await setDoc(doc(db, `slotAvailability/${SLOT_BB_EXPIRED}`), {
        id: SLOT_BB_EXPIRED,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "07:00",
        status: "held",
        bookingTier: "DEPOSIT",
        bookingId: "booking_bb_expired",
        expiresAt: expiredIso,
        updatedAt: nowIso,
      });
    });
  }

  const o1Db = testEnv.authenticatedContext(UID_O1).firestore();
  const o2Db = testEnv.authenticatedContext(UID_O2).firestore();
  const aDb = testEnv.authenticatedContext(UID_A).firestore();
  const bDb = testEnv.authenticatedContext(UID_B).firestore();
  const cDb = testEnv.authenticatedContext(UID_C).firestore();
  const dDb = testEnv.authenticatedContext(UID_D).firestore();
  const adminDb = testEnv.authenticatedContext(UID_ADMIN, { role: "admin" }).firestore();
  const unauthDb = testEnv.unauthenticatedContext().firestore();

  // ============================================================================
  // SUITE A: ALLOW — Real Application Payloads & Authorized Access
  // ============================================================================
  printSuiteHeader("SUITE A: ALLOW — Real V1 Slot & Walk-in Flows");

  await recordTest(
    "TC-SL-A01",
    "Suite A",
    "Player A creates slotLock + slotAvailability for a free slot (TENTATIVE tier)",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "08:00");
      await assertSucceeds(
        setDoc(doc(aDb, `slotLocks/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "08:00",
          slots: ["08:00"],
          bookingId: "booking_a_tent",
          userId: UID_A,
          status: "tentative",
          tier: "TENTATIVE",
          createdAt: nowIso,
          expiresAt: futureIso,
        })
      );
      await assertSucceeds(
        setDoc(doc(aDb, `slotAvailability/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "08:00",
          status: "tentative",
          bookingTier: "TENTATIVE",
          bookingId: "booking_a_tent",
          expiresAt: futureIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-A02",
    "Suite A",
    "Player A creates slotLock + slotAvailability for a free slot (DEPOSIT tier)",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "09:00");
      await assertSucceeds(
        setDoc(doc(aDb, `slotLocks/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "09:00",
          slots: ["09:00"],
          bookingId: "booking_a_dep",
          userId: UID_A,
          status: "active",
          tier: "DEPOSIT",
          createdAt: nowIso,
          expiresAt: futureIso,
        })
      );
      await assertSucceeds(
        setDoc(doc(aDb, `slotAvailability/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "09:00",
          status: "held",
          bookingTier: "DEPOSIT",
          bookingId: "booking_a_dep",
          expiresAt: futureIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-A03",
    "Suite A",
    "Player A creates slotLock + slotAvailability for a free slot (FULL tier)",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "11:00");
      await assertSucceeds(
        setDoc(doc(aDb, `slotLocks/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "11:00",
          slots: ["11:00"],
          bookingId: "booking_a_full",
          userId: UID_A,
          status: "active",
          tier: "FULL",
          createdAt: nowIso,
          expiresAt: futureIso,
        })
      );
      await assertSucceeds(
        setDoc(doc(aDb, `slotAvailability/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "11:00",
          status: "held",
          bookingTier: "FULL",
          bookingId: "booking_a_full",
          expiresAt: futureIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-A04",
    "Suite A",
    "Player B preempts D's tentative booking BT: overwrites 16:00 lock & availability and opens D's other slot 17:00",
    async () => {
      await seedBaseFixtures();
      // Release D's other slot (17:00)
      await assertSucceeds(
        updateDoc(doc(bDb, `slotLocks/${SLOT_BT_2}`), {
          status: "released",
          releasedAt: nowIso,
          releaseReason: "preempted",
        })
      );
      await assertSucceeds(
        setDoc(
          doc(bDb, `slotAvailability/${SLOT_BT_2}`),
          {
            id: SLOT_BT_2,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "17:00",
            status: "open",
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
      // Overwrite D's tentative slot (16:00) with B's paying lock & availability
      await assertSucceeds(
        setDoc(doc(bDb, `slotLocks/${SLOT_BT_1}`), {
          id: SLOT_BT_1,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "16:00",
          slots: ["16:00"],
          bookingId: "booking_b_preempt",
          userId: UID_B,
          status: "active",
          tier: "DEPOSIT",
          createdAt: nowIso,
          expiresAt: futureIso,
        })
      );
      await assertSucceeds(
        setDoc(doc(bDb, `slotAvailability/${SLOT_BT_1}`), {
          id: SLOT_BT_1,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "16:00",
          status: "held",
          bookingTier: "DEPOSIT",
          bookingId: "booking_b_preempt",
          expiresAt: futureIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-A05",
    "Suite A",
    "Lock owner D upgrades own tentative lock to active/DEPOSIT and availability to held",
    async () => {
      await seedBaseFixtures();
      await assertSucceeds(
        updateDoc(doc(dDb, `slotLocks/${SLOT_BT_1}`), {
          status: "active",
          tier: "DEPOSIT",
          expiresAt: futureIso,
          updatedAt: nowIso,
        })
      );
      await assertSucceeds(
        setDoc(
          doc(dDb, `slotAvailability/${SLOT_BT_1}`),
          {
            id: SLOT_BT_1,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "16:00",
            status: "held",
            bookingTier: "DEPOSIT",
            bookingId: "booking_bt",
            expiresAt: futureIso,
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
    }
  );

  await recordTest(
    "TC-SL-A06",
    "Suite A",
    "Player A cancels own unconfirmed booking BA (lock released, availability open)",
    async () => {
      await seedBaseFixtures();
      await assertSucceeds(
        updateDoc(doc(aDb, `slotLocks/${SLOT_BA}`), {
          status: "released",
          releasedAt: nowIso,
          releaseReason: "player_cancelled",
        })
      );
      await assertSucceeds(
        setDoc(
          doc(aDb, `slotAvailability/${SLOT_BA}`),
          {
            id: SLOT_BA,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "10:00",
            status: "open",
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
    }
  );

  await recordTest(
    "TC-SL-A07",
    "Suite A",
    "Owner O1 confirms BA (sets slotAvailability to booked; lock untouched)",
    async () => {
      await seedBaseFixtures();
      await assertSucceeds(
        setDoc(
          doc(o1Db, `slotAvailability/${SLOT_BA}`),
          {
            id: SLOT_BA,
            pitchId: PITCH_P1,
            bookingId: "booking_ba",
            date: TEST_DATE,
            time: "10:00",
            status: "booked",
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
    }
  );

  await recordTest(
    "TC-SL-A08",
    "Suite A",
    "Owner O1 declines BA (lock released, availability open)",
    async () => {
      await seedBaseFixtures();
      await assertSucceeds(
        updateDoc(doc(o1Db, `slotLocks/${SLOT_BA}`), {
          status: "released",
          releasedAt: nowIso,
          releaseReason: "owner_rejected_payment",
        })
      );
      await assertSucceeds(
        setDoc(
          doc(o1Db, `slotAvailability/${SLOT_BA}`),
          {
            id: SLOT_BA,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "10:00",
            status: "open",
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
    }
  );

  await recordTest(
    "TC-SL-A09",
    "Suite A",
    "Owner O1 confirmUnpaidReservation creates a missing lock with userId = O1 and marks availability booked",
    async () => {
      await seedBaseFixtures();
      const missingKey = makeSlotKey(PITCH_P1, TEST_DATE, "18:00");
      await assertSucceeds(
        setDoc(doc(o1Db, `slotLocks/${missingKey}`), {
          id: missingKey,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "18:00",
          slots: ["18:00"],
          bookingId: "booking_bt",
          userId: UID_O1,
          playerId: UID_D,
          status: "active",
          tier: "CONFIRMED",
          createdAt: nowIso,
          expiresAt: futureIso,
        })
      );
      await assertSucceeds(
        setDoc(
          doc(o1Db, `slotAvailability/${missingKey}`),
          {
            id: missingKey,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "18:00",
            status: "booked",
            bookingTier: "CONFIRMED",
            bookingId: "booking_bt",
            expiresAt: futureIso,
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
    }
  );

  await recordTest(
    "TC-SL-A10",
    "Suite A",
    "Owner O1 blocks a slot (availability blocked + lock owner_block + slotNotes doc) and unblocks it (open, released, slotNotes deleted)",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "19:00");
      // Block
      await assertSucceeds(
        setDoc(
          doc(o1Db, `slotAvailability/${key}`),
          {
            id: key,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "19:00",
            status: "blocked",
            reason: "walk_in",
            blockReason: "WALK_IN",
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
      await assertSucceeds(
        setDoc(
          doc(o1Db, `slotLocks/${key}`),
          {
            id: key,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "19:00",
            userId: UID_O1,
            status: "active",
            reason: "owner_block_walk_in",
            createdAt: nowIso,
            expiresAt: oneYearIso,
          },
          { merge: true }
        )
      );
      await assertSucceeds(
        setDoc(doc(o1Db, `slotNotes/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          ownerId: UID_O1,
          date: TEST_DATE,
          time: "19:00",
          blockReason: "WALK_IN",
          blockNote: "Moses Walk-in",
          blockPhone: "+256701555666",
          updatedAt: nowIso,
        })
      );

      // Unblock
      await assertSucceeds(
        setDoc(
          doc(o1Db, `slotAvailability/${key}`),
          {
            id: key,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "19:00",
            status: "open",
            reason: "",
            blockReason: "",
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
      await assertSucceeds(
        setDoc(
          doc(o1Db, `slotLocks/${key}`),
          {
            id: key,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "19:00",
            userId: UID_O1,
            status: "released",
            releaseReason: "owner_unlocked",
            releasedAt: nowIso,
          },
          { merge: true }
        )
      );
      await assertSucceeds(deleteDoc(doc(o1Db, `slotNotes/${key}`)));
    }
  );

  await recordTest(
    "TC-SL-A11",
    "Suite A",
    "Admin releases a slotLock (status 'released' with serverTimestamp)",
    async () => {
      await seedBaseFixtures();
      await assertSucceeds(
        updateDoc(doc(adminDb, `slotLocks/${SLOT_BC}`), {
          status: "released",
          updatedAt: serverTimestamp(),
        })
      );
    }
  );

  await recordTest(
    "TC-SL-A12",
    "Suite A",
    "Another player B's sweep releases expired lock of UNCONFIRMED booking BA and reopens availability",
    async () => {
      await seedBaseFixtures();
      await assertSucceeds(
        updateDoc(doc(bDb, `slotLocks/${SLOT_BA}`), {
          status: "expired",
          releasedAt: nowIso,
          releaseReason: "payment_window_expired_15min",
        })
      );
      await assertSucceeds(
        setDoc(
          doc(bDb, `slotAvailability/${SLOT_BA}`),
          {
            id: SLOT_BA,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "10:00",
            status: "open",
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
    }
  );

  await recordTest(
    "TC-SL-A13",
    "Suite A",
    "Anyone reads slotAvailability; owner O1 reads own slotNotes (getDoc + filtered query)",
    async () => {
      await seedBaseFixtures();
      await assertSucceeds(getDoc(doc(unauthDb, `slotAvailability/${SLOT_BC}`)));
      await assertSucceeds(getDoc(doc(aDb, `slotAvailability/${SLOT_BLOCK}`)));
      await assertSucceeds(getDoc(doc(o1Db, `slotNotes/${SLOT_BLOCK}`)));
      await assertSucceeds(
        getDocs(
          query(
            collection(o1Db, "slotNotes"),
            where("ownerId", "==", UID_O1),
            where("pitchId", "==", PITCH_P1),
            where("date", "==", TEST_DATE)
          )
        )
      );
    }
  );

  await recordTest(
    "TC-SL-A14",
    "Suite A",
    "Player C's sweep releases B's PENDING_PAYMENT lock after expiresAtMs and reopens slotAvailability",
    async () => {
      await seedBaseFixtures();
      const batch = writeBatch(cDb);
      batch.update(doc(cDb, `slotLocks/${SLOT_BB_EXPIRED}`), {
        status: "expired",
        releasedAt: nowIso,
        releaseReason: "payment_window_expired_15min",
      });
      batch.set(
        doc(cDb, `slotAvailability/${SLOT_BB_EXPIRED}`),
        {
          id: SLOT_BB_EXPIRED,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "07:00",
          status: "open",
          updatedAt: nowIso,
        },
        { merge: true }
      );
      await assertSucceeds(batch.commit());
    }
  );

  await recordTest(
    "TC-SL-A15",
    "Suite A",
    "Player B cancels own PENDING_PAYMENT booking (lock released + availability open in one batch)",
    async () => {
      await seedBaseFixtures();
      const batch = writeBatch(bDb);
      batch.update(doc(bDb, `slotLocks/${SLOT_BB_HELD}`), {
        status: "released",
        releasedAt: nowIso,
        releaseReason: "player_cancelled",
      });
      batch.set(
        doc(bDb, `slotAvailability/${SLOT_BB_HELD}`),
        {
          id: SLOT_BB_HELD,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "22:00",
          status: "open",
          updatedAt: nowIso,
        },
        { merge: true }
      );
      await assertSucceeds(batch.commit());
    }
  );

  await recordTest(
    "TC-SL-A16",
    "Suite A",
    "Player A books over Player B's expired unswept ACTIVE lock (PENDING_PAYMENT) and writes slotAvailability held in the same batch",
    async () => {
      await seedBaseFixtures();
      const batch = writeBatch(aDb);
      batch.set(doc(aDb, `slotLocks/${SLOT_BB_EXPIRED}`), {
        id: SLOT_BB_EXPIRED,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "07:00",
        slots: ["07:00"],
        bookingId: "booking_a_takeover_active",
        userId: UID_A,
        status: "active",
        tier: "DEPOSIT",
        createdAt: nowIso,
        expiresAt: futureIso,
        expiresAtMs: futureMs,
      });
      batch.set(doc(aDb, `slotAvailability/${SLOT_BB_EXPIRED}`), {
        id: SLOT_BB_EXPIRED,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "07:00",
        status: "held",
        bookingTier: "DEPOSIT",
        bookingId: "booking_a_takeover_active",
        expiresAt: futureIso,
        updatedAt: nowIso,
      });
      await assertSucceeds(batch.commit());
    }
  );

  await recordTest(
    "TC-SL-A17",
    "Suite A",
    "Player A books TENTATIVE over Player B's expired unswept TENTATIVE lock",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "06:00");
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await setDoc(doc(db, "bookings/booking_b_tent_exp"), {
          id: "booking_b_tent_exp",
          pitchId: PITCH_P1,
          ownerId: UID_O1,
          playerId: UID_B,
          userId: UID_B,
          date: TEST_DATE,
          time: "06:00",
          slots: ["06:00"],
          status: "TENTATIVE",
          bookingTier: "TENTATIVE",
          paymentStatus: "UNPAID",
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        await setDoc(doc(db, `slotLocks/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "06:00",
          slots: ["06:00"],
          bookingId: "booking_b_tent_exp",
          userId: UID_B,
          status: "tentative",
          tier: "TENTATIVE",
          createdAt: nowIso,
          expiresAt: expiredIso,
          expiresAtMs: expiredMs,
        });
        await setDoc(doc(db, `slotAvailability/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "06:00",
          status: "tentative",
          bookingTier: "TENTATIVE",
          bookingId: "booking_b_tent_exp",
          expiresAt: expiredIso,
          updatedAt: nowIso,
        });
      });

      const batch = writeBatch(aDb);
      batch.set(doc(aDb, `slotLocks/${key}`), {
        id: key,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "06:00",
        slots: ["06:00"],
        bookingId: "booking_a_takeover_tent",
        userId: UID_A,
        status: "tentative",
        tier: "TENTATIVE",
        createdAt: nowIso,
        expiresAt: futureIso,
        expiresAtMs: futureMs,
      });
      batch.set(doc(aDb, `slotAvailability/${key}`), {
        id: key,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "06:00",
        status: "tentative",
        bookingTier: "TENTATIVE",
        bookingId: "booking_a_takeover_tent",
        expiresAt: futureIso,
        updatedAt: nowIso,
      });
      await assertSucceeds(batch.commit());
    }
  );

  await recordTest(
    "TC-SL-A18",
    "Suite A",
    "Player A re-books over A's OWN expired unswept active lock with a new bookingId",
    async () => {
      await seedBaseFixtures();
      const batch = writeBatch(aDb);
      batch.set(doc(aDb, `slotLocks/${SLOT_BA}`), {
        id: SLOT_BA,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "10:00",
        slots: ["10:00"],
        bookingId: "booking_a_rebook_new",
        userId: UID_A,
        status: "active",
        tier: "FULL",
        createdAt: nowIso,
        expiresAt: futureIso,
        expiresAtMs: futureMs,
      });
      batch.set(doc(aDb, `slotAvailability/${SLOT_BA}`), {
        id: SLOT_BA,
        pitchId: PITCH_P1,
        date: TEST_DATE,
        time: "10:00",
        status: "held",
        bookingTier: "FULL",
        bookingId: "booking_a_rebook_new",
        expiresAt: futureIso,
        updatedAt: nowIso,
      });
      await assertSucceeds(batch.commit());
    }
  );

  // ============================================================================
  // SUITE B: DENY — /slotAvailability Integrity & Schema Boundaries
  // ============================================================================
  printSuiteHeader("SUITE B: DENY — /slotAvailability Integrity Boundaries");

  await recordTest(
    "TC-SL-B01",
    "Suite B",
    "Player A (and player C) CANNOT reopen BC's booked slotAvailability",
    async () => {
      await seedBaseFixtures();
      await assertFails(
        setDoc(
          doc(aDb, `slotAvailability/${SLOT_BC}`),
          {
            id: SLOT_BC,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "12:00",
            status: "open",
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
      await assertFails(
        setDoc(
          doc(cDb, `slotAvailability/${SLOT_BC}`),
          {
            id: SLOT_BC,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "12:00",
            status: "open",
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
    }
  );

  await recordTest(
    "TC-SL-B02",
    "Suite B",
    "Player A CANNOT block any slot (status 'blocked')",
    async () => {
      await seedBaseFixtures();
      const freeKey = makeSlotKey(PITCH_P1, TEST_DATE, "20:00");
      await assertFails(
        setDoc(doc(aDb, `slotAvailability/${freeKey}`), {
          id: freeKey,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "20:00",
          status: "blocked",
          reason: "maintenance",
          blockReason: "MAINTENANCE",
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-B03",
    "Suite B",
    "Player A CANNOT overwrite an owner block on slotAvailability",
    async () => {
      await seedBaseFixtures();
      await assertFails(
        setDoc(
          doc(aDb, `slotAvailability/${SLOT_BLOCK}`),
          {
            id: SLOT_BLOCK,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "14:00",
            status: "open",
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
      await assertFails(
        setDoc(doc(aDb, `slotAvailability/${SLOT_BLOCK}`), {
          id: SLOT_BLOCK,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "14:00",
          status: "held",
          bookingTier: "FULL",
          bookingId: "booking_hijack",
          expiresAt: futureIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-B04",
    "Suite B",
    "Player A CANNOT change pitchId, date, or time of an existing slotAvailability doc",
    async () => {
      await seedBaseFixtures();
      await assertFails(
        updateDoc(doc(aDb, `slotAvailability/${SLOT_BA}`), {
          pitchId: PITCH_P2,
          updatedAt: nowIso,
        })
      );
      await assertFails(
        updateDoc(doc(aDb, `slotAvailability/${SLOT_BA}`), {
          date: "2026-11-21",
          updatedAt: nowIso,
        })
      );
      await assertFails(
        updateDoc(doc(aDb, `slotAvailability/${SLOT_BA}`), {
          time: "11:00",
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-B05",
    "Suite B",
    "Owner O2 (other pitch owner) CANNOT block or open a P1 slotAvailability",
    async () => {
      await seedBaseFixtures();
      const freeP1 = makeSlotKey(PITCH_P1, TEST_DATE, "21:00");
      await assertFails(
        setDoc(doc(o2Db, `slotAvailability/${freeP1}`), {
          id: freeP1,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "21:00",
          status: "blocked",
          reason: "maintenance",
          blockReason: "MAINTENANCE",
          updatedAt: nowIso,
        })
      );
      await assertFails(
        setDoc(
          doc(o2Db, `slotAvailability/${SLOT_BLOCK}`),
          {
            id: SLOT_BLOCK,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "14:00",
            status: "open",
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
      await assertFails(
        setDoc(
          doc(o2Db, `slotAvailability/${SLOT_BC}`),
          {
            id: SLOT_BC,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "12:00",
            status: "open",
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
    }
  );

  await recordTest(
    "TC-SL-B06",
    "Suite B",
    "slotAvailability with unknown key (e.g., blockNote/blockPhone/extra) is DENIED",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "21:00");
      await assertFails(
        setDoc(doc(o1Db, `slotAvailability/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "21:00",
          status: "blocked",
          reason: "walk_in",
          blockReason: "WALK_IN",
          blockNote: "PII Should Not Be Public",
          updatedAt: nowIso,
        })
      );
      await assertFails(
        setDoc(doc(aDb, `slotAvailability/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "21:00",
          status: "held",
          extraField: "bad",
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-B07",
    "Suite B",
    "slotAvailability with bad status is DENIED",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "21:00");
      await assertFails(
        setDoc(doc(o1Db, `slotAvailability/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "21:00",
          status: "invalid_status",
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-B08",
    "Suite B",
    "slotAvailability with id != slotId is DENIED",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "21:00");
      await assertFails(
        setDoc(doc(aDb, `slotAvailability/${key}`), {
          id: "wrong_id",
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "21:00",
          status: "held",
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-B09",
    "Suite B",
    "Player A CANNOT set slotAvailability status to 'booked'",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "21:00");
      await assertFails(
        setDoc(doc(aDb, `slotAvailability/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "21:00",
          status: "booked",
          bookingId: "booking_fake",
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-B10",
    "Suite B",
    "Player A CANNOT release Player B's held DEPOSIT slotAvailability to open while B's lock is still active",
    async () => {
      await seedBaseFixtures();
      await assertFails(
        setDoc(
          doc(aDb, `slotAvailability/${SLOT_BB_HELD}`),
          {
            id: SLOT_BB_HELD,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: "22:00",
            status: "open",
            updatedAt: nowIso,
          },
          { merge: true }
        )
      );
    }
  );

  // ============================================================================
  // SUITE C: DENY — /slotLocks Hijack, Overwrite, Release & Delete Boundaries
  // ============================================================================
  printSuiteHeader("SUITE C: DENY — /slotLocks Hijack & Protection Boundaries");

  await recordTest(
    "TC-SL-C01",
    "Suite C",
    "Player A CANNOT overwrite or release an owner block's slotLock",
    async () => {
      await seedBaseFixtures();
      await assertFails(
        setDoc(doc(aDb, `slotLocks/${SLOT_BLOCK}`), {
          id: SLOT_BLOCK,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "14:00",
          slots: ["14:00"],
          bookingId: "booking_hijack",
          userId: UID_A,
          status: "active",
          tier: "FULL",
          createdAt: nowIso,
          expiresAt: futureIso,
        })
      );
      await assertFails(
        updateDoc(doc(aDb, `slotLocks/${SLOT_BLOCK}`), {
          status: "released",
          releasedAt: nowIso,
          releaseReason: "hijack",
        })
      );
    }
  );

  await recordTest(
    "TC-SL-C02",
    "Suite C",
    "Player B (and player C) CANNOT update, overwrite, or release BC's CONFIRMED lock (even with expired expiresAt)",
    async () => {
      await seedBaseFixtures();
      // Player B tries to release expired lock of CONFIRMED booking BC
      await assertFails(
        updateDoc(doc(bDb, `slotLocks/${SLOT_BC}`), {
          status: "expired",
          releasedAt: nowIso,
          releaseReason: "payment_window_expired_15min",
        })
      );
      // Player B tries to overwrite BC's lock with userId = B
      await assertFails(
        setDoc(doc(bDb, `slotLocks/${SLOT_BC}`), {
          id: SLOT_BC,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "12:00",
          slots: ["12:00"],
          bookingId: "booking_b_steal",
          userId: UID_B,
          status: "active",
          tier: "FULL",
          createdAt: nowIso,
          expiresAt: futureIso,
        })
      );
      // Player C (own booking) tries to release CONFIRMED booking's lock
      await assertFails(
        updateDoc(doc(cDb, `slotLocks/${SLOT_BC}`), {
          status: "released",
          releasedAt: nowIso,
          releaseReason: "player_cancelled",
        })
      );
    }
  );

  await recordTest(
    "TC-SL-C03",
    "Suite C",
    "Player A CANNOT change pitchId, date, time, or bookingId on own slotLock",
    async () => {
      await seedBaseFixtures();
      await assertFails(
        updateDoc(doc(aDb, `slotLocks/${SLOT_BA}`), {
          pitchId: PITCH_P2,
          updatedAt: nowIso,
        })
      );
      await assertFails(
        updateDoc(doc(aDb, `slotLocks/${SLOT_BA}`), {
          date: "2026-11-21",
          updatedAt: nowIso,
        })
      );
      await assertFails(
        updateDoc(doc(aDb, `slotLocks/${SLOT_BA}`), {
          time: "11:00",
          updatedAt: nowIso,
        })
      );
      await assertFails(
        updateDoc(doc(aDb, `slotLocks/${SLOT_BA}`), {
          bookingId: "booking_other",
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-C04",
    "Suite C",
    "Player B CANNOT delete someone else's slotLock (BC, BT tentative, or O1 block)",
    async () => {
      await seedBaseFixtures();
      await assertFails(deleteDoc(doc(bDb, `slotLocks/${SLOT_BC}`)));
      await assertFails(deleteDoc(doc(bDb, `slotLocks/${SLOT_BT_1}`)));
      await assertFails(deleteDoc(doc(bDb, `slotLocks/${SLOT_BLOCK}`)));
    }
  );

  await recordTest(
    "TC-SL-C05",
    "Suite C",
    "Owner O2 CANNOT overwrite or release a P1 owner block or confirmed slotLock",
    async () => {
      await seedBaseFixtures();
      await assertFails(
        updateDoc(doc(o2Db, `slotLocks/${SLOT_BLOCK}`), {
          status: "released",
          releasedAt: nowIso,
        })
      );
      await assertFails(
        updateDoc(doc(o2Db, `slotLocks/${SLOT_BC}`), {
          status: "released",
          releasedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-C06",
    "Suite C",
    "Player A CANNOT create a slotLock with userId != own uid",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "21:00");
      await assertFails(
        setDoc(doc(aDb, `slotLocks/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "21:00",
          slots: ["21:00"],
          bookingId: "booking_spoof",
          userId: UID_B,
          status: "active",
          tier: "FULL",
          createdAt: nowIso,
          expiresAt: futureIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-C07",
    "Suite C",
    "slotLock with id != lockId, bad status, or bad tier is DENIED",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "21:00");
      await assertFails(
        setDoc(doc(aDb, `slotLocks/${key}`), {
          id: "wrong_lock_id",
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "21:00",
          userId: UID_A,
          status: "active",
          tier: "FULL",
          createdAt: nowIso,
          expiresAt: futureIso,
        })
      );
      await assertFails(
        setDoc(doc(aDb, `slotLocks/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "21:00",
          userId: UID_A,
          status: "RELEASED",
          tier: "FULL",
          createdAt: nowIso,
          expiresAt: futureIso,
        })
      );
      await assertFails(
        setDoc(doc(aDb, `slotLocks/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "21:00",
          userId: UID_A,
          status: "active",
          tier: "FREE_VIP",
          createdAt: nowIso,
          expiresAt: futureIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-C08",
    "Suite C",
    "Player C CANNOT release B's active PENDING_PAYMENT lock without expiresAtMs OR before expiresAtMs",
    async () => {
      await seedBaseFixtures();
      // Active lock without expiresAtMs (legacy lock) cannot be released by third party
      await assertFails(
        updateDoc(doc(cDb, `slotLocks/${SLOT_BB_NO_MS}`), {
          status: "expired",
          releasedAt: nowIso,
          releaseReason: "payment_window_expired_15min",
        })
      );
      // Active lock with future expiresAtMs cannot be released by third party before expiresAtMs
      await assertFails(
        updateDoc(doc(cDb, `slotLocks/${SLOT_BB_HELD}`), {
          status: "expired",
          releasedAt: nowIso,
          releaseReason: "payment_window_expired_15min",
        })
      );
      await assertFails(
        updateDoc(doc(cDb, `slotLocks/${SLOT_BB_HELD}`), {
          status: "released",
          releasedAt: nowIso,
          releaseReason: "premature_release",
        })
      );
    }
  );

  await recordTest(
    "TC-SL-C09",
    "Suite C",
    "Player A CANNOT take over an active or tentative lock BEFORE expiresAtMs",
    async () => {
      await seedBaseFixtures();
      // Active lock before expiresAtMs (SLOT_BB_HELD has futureMs)
      await assertFails(
        setDoc(doc(aDb, `slotLocks/${SLOT_BB_HELD}`), {
          id: SLOT_BB_HELD,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "22:00",
          slots: ["22:00"],
          bookingId: "booking_a_early_active",
          userId: UID_A,
          status: "active",
          tier: "FULL",
          createdAt: nowIso,
          expiresAt: futureIso,
          expiresAtMs: futureMs,
        })
      );
      // Tentative lock before expiresAtMs (SLOT_BT_1 has futureMs) taken over with TENTATIVE
      await assertFails(
        setDoc(doc(aDb, `slotLocks/${SLOT_BT_1}`), {
          id: SLOT_BT_1,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "16:00",
          slots: ["16:00"],
          bookingId: "booking_a_early_tent",
          userId: UID_A,
          status: "tentative",
          tier: "TENTATIVE",
          createdAt: nowIso,
          expiresAt: futureIso,
          expiresAtMs: futureMs,
        })
      );
      // Player B re-booking over own unexpired active lock with a new bookingId
      await assertFails(
        setDoc(doc(bDb, `slotLocks/${SLOT_BB_HELD}`), {
          id: SLOT_BB_HELD,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "22:00",
          slots: ["22:00"],
          bookingId: "booking_b_early_rebook",
          userId: UID_B,
          status: "active",
          tier: "FULL",
          createdAt: nowIso,
          expiresAt: futureIso,
          expiresAtMs: futureMs,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-C10",
    "Suite C",
    "Player A CANNOT take over an expired lock whose booking is CONFIRMED, DEPOSIT_PAID, CHECKED_IN, or COMPLETED",
    async () => {
      await seedBaseFixtures();
      // 1. CONFIRMED (existing SLOT_BC has expiredMs)
      await assertFails(
        setDoc(doc(aDb, `slotLocks/${SLOT_BC}`), {
          id: SLOT_BC,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "12:00",
          slots: ["12:00"],
          bookingId: "booking_a_steal_confirmed",
          userId: UID_A,
          status: "active",
          tier: "FULL",
          createdAt: nowIso,
          expiresAt: futureIso,
          expiresAtMs: futureMs,
        })
      );

      // 2-4. DEPOSIT_PAID, CHECKED_IN, COMPLETED
      const protectedCases: Array<{ status: string; time: string }> = [
        { status: "DEPOSIT_PAID", time: "05:00" },
        { status: "CHECKED_IN", time: "04:00" },
        { status: "COMPLETED", time: "03:00" },
      ];
      for (const tc of protectedCases) {
        const key = makeSlotKey(PITCH_P1, TEST_DATE, tc.time);
        const bId = `booking_prot_${tc.status.toLowerCase()}`;
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
          const db = ctx.firestore();
          await setDoc(doc(db, `bookings/${bId}`), {
            id: bId,
            pitchId: PITCH_P1,
            ownerId: UID_O1,
            playerId: UID_C,
            userId: UID_C,
            date: TEST_DATE,
            time: tc.time,
            slots: [tc.time],
            status: tc.status,
            bookingTier: "FULL",
            createdAt: nowIso,
            updatedAt: nowIso,
          });
          await setDoc(doc(db, `slotLocks/${key}`), {
            id: key,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: tc.time,
            slots: [tc.time],
            bookingId: bId,
            userId: UID_C,
            status: "active",
            tier: "FULL",
            createdAt: nowIso,
            expiresAt: expiredIso,
            expiresAtMs: expiredMs,
          });
        });

        await assertFails(
          setDoc(doc(aDb, `slotLocks/${key}`), {
            id: key,
            pitchId: PITCH_P1,
            date: TEST_DATE,
            time: tc.time,
            slots: [tc.time],
            bookingId: `booking_a_steal_${tc.status.toLowerCase()}`,
            userId: UID_A,
            status: "active",
            tier: "FULL",
            createdAt: nowIso,
            expiresAt: futureIso,
            expiresAtMs: futureMs,
          })
        );
      }
    }
  );

  await recordTest(
    "TC-SL-C11",
    "Suite C",
    "Player A CANNOT take over an owner-block lock (has 'reason'), even if expired",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "15:00");
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await setDoc(doc(db, `slotLocks/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "15:00",
          userId: UID_O1,
          status: "active",
          reason: "owner_block_walk_in",
          createdAt: nowIso,
          expiresAt: expiredIso,
          expiresAtMs: expiredMs,
        });
      });

      await assertFails(
        setDoc(doc(aDb, `slotLocks/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "15:00",
          slots: ["15:00"],
          bookingId: "booking_a_steal_block",
          userId: UID_A,
          status: "active",
          tier: "FULL",
          createdAt: nowIso,
          expiresAt: futureIso,
          expiresAtMs: futureMs,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-C12",
    "Suite C",
    "Player A CANNOT take over an expired lock when request userId is not the caller",
    async () => {
      await seedBaseFixtures();
      await assertFails(
        setDoc(doc(aDb, `slotLocks/${SLOT_BB_EXPIRED}`), {
          id: SLOT_BB_EXPIRED,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "07:00",
          slots: ["07:00"],
          bookingId: "booking_spoof_takeover",
          userId: UID_C,
          status: "active",
          tier: "FULL",
          createdAt: nowIso,
          expiresAt: futureIso,
          expiresAtMs: futureMs,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-C13",
    "Suite C",
    "Player A CANNOT take over an expired lock that has no expiresAtMs",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "13:00");
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await setDoc(doc(db, "bookings/booking_b_exp_noms"), {
          id: "booking_b_exp_noms",
          pitchId: PITCH_P1,
          ownerId: UID_O1,
          playerId: UID_B,
          userId: UID_B,
          date: TEST_DATE,
          time: "13:00",
          slots: ["13:00"],
          status: "PENDING_PAYMENT",
          bookingTier: "DEPOSIT",
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        await setDoc(doc(db, `slotLocks/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "13:00",
          slots: ["13:00"],
          bookingId: "booking_b_exp_noms",
          userId: UID_B,
          status: "active",
          tier: "DEPOSIT",
          createdAt: nowIso,
          expiresAt: expiredIso,
        });
      });

      await assertFails(
        setDoc(doc(aDb, `slotLocks/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          date: TEST_DATE,
          time: "13:00",
          slots: ["13:00"],
          bookingId: "booking_a_takeover_noms",
          userId: UID_A,
          status: "active",
          tier: "FULL",
          createdAt: nowIso,
          expiresAt: futureIso,
          expiresAtMs: futureMs,
        })
      );
    }
  );

  // ============================================================================
  // SUITE D: DENY — /slotNotes Owner-Private Walk-in Notes Boundaries
  // ============================================================================
  printSuiteHeader("SUITE D: DENY — /slotNotes Private Walk-in Notes Boundaries");

  await recordTest(
    "TC-SL-D01",
    "Suite D",
    "Owner O2 CANNOT read O1's slotNotes (getDoc or query)",
    async () => {
      await seedBaseFixtures();
      await assertFails(getDoc(doc(o2Db, `slotNotes/${SLOT_BLOCK}`)));
      await assertFails(
        getDocs(
          query(
            collection(o2Db, "slotNotes"),
            where("pitchId", "==", PITCH_P1),
            where("date", "==", TEST_DATE)
          )
        )
      );
    }
  );

  await recordTest(
    "TC-SL-D02",
    "Suite D",
    "Owner O2 CANNOT create, update, or delete slotNotes for O1's pitch P1",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "20:00");
      await assertFails(
        setDoc(doc(o2Db, `slotNotes/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          ownerId: UID_O2,
          date: TEST_DATE,
          time: "20:00",
          blockReason: "WALK_IN",
          blockNote: "Spoof note",
          blockPhone: "+256700000000",
          updatedAt: nowIso,
        })
      );
      await assertFails(
        updateDoc(doc(o2Db, `slotNotes/${SLOT_BLOCK}`), {
          blockNote: "Tampered",
          updatedAt: nowIso,
        })
      );
      await assertFails(deleteDoc(doc(o2Db, `slotNotes/${SLOT_BLOCK}`)));
    }
  );

  await recordTest(
    "TC-SL-D03",
    "Suite D",
    "Player A (and unauthenticated user) CANNOT read O1's slotNotes",
    async () => {
      await seedBaseFixtures();
      await assertFails(getDoc(doc(aDb, `slotNotes/${SLOT_BLOCK}`)));
      await assertFails(getDoc(doc(unauthDb, `slotNotes/${SLOT_BLOCK}`)));
      await assertFails(
        getDocs(
          query(
            collection(aDb, "slotNotes"),
            where("pitchId", "==", PITCH_P1)
          )
        )
      );
    }
  );

  await recordTest(
    "TC-SL-D04",
    "Suite D",
    "Owner O1 CANNOT write a slotNotes doc with an extra unknown key",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "20:00");
      await assertFails(
        setDoc(doc(o1Db, `slotNotes/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          ownerId: UID_O1,
          date: TEST_DATE,
          time: "20:00",
          blockReason: "WALK_IN",
          blockNote: "Valid",
          blockPhone: "+256700000001",
          extraField: "nope",
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-D05",
    "Suite D",
    "Owner O1 CANNOT write a slotNotes doc with ownerId != own uid",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "20:00");
      await assertFails(
        setDoc(doc(o1Db, `slotNotes/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          ownerId: UID_O2,
          date: TEST_DATE,
          time: "20:00",
          blockReason: "WALK_IN",
          blockNote: "Wrong ownerId",
          blockPhone: "",
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-D06",
    "Suite D",
    "Player A CANNOT write a slotNotes doc for pitch P1 (pitch caller does not own)",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "20:00");
      await assertFails(
        setDoc(doc(aDb, `slotNotes/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          ownerId: UID_A,
          date: TEST_DATE,
          time: "20:00",
          blockReason: "WALK_IN",
          blockNote: "Not owner",
          blockPhone: "",
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-D07",
    "Suite D",
    "Owner O1 CANNOT write a slotNotes doc with blockNote > 120 chars (or blockPhone > 120 chars)",
    async () => {
      await seedBaseFixtures();
      const key = makeSlotKey(PITCH_P1, TEST_DATE, "20:00");
      await assertFails(
        setDoc(doc(o1Db, `slotNotes/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          ownerId: UID_O1,
          date: TEST_DATE,
          time: "20:00",
          blockReason: "WALK_IN",
          blockNote: "x".repeat(121),
          blockPhone: "+256700000001",
          updatedAt: nowIso,
        })
      );
      await assertFails(
        setDoc(doc(o1Db, `slotNotes/${key}`), {
          id: key,
          pitchId: PITCH_P1,
          ownerId: UID_O1,
          date: TEST_DATE,
          time: "20:00",
          blockReason: "WALK_IN",
          blockNote: "Ok",
          blockPhone: "9".repeat(121),
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-SL-D08",
    "Suite D",
    "Owner O1 CANNOT write a slotNotes doc whose slotKey does not match pitchId_date_time",
    async () => {
      await seedBaseFixtures();
      const mismatchedKey = makeSlotKey(PITCH_P1, TEST_DATE, "21:00");
      await assertFails(
        setDoc(doc(o1Db, `slotNotes/${mismatchedKey}`), {
          id: mismatchedKey,
          pitchId: PITCH_P1,
          ownerId: UID_O1,
          date: TEST_DATE,
          time: "20:00",
          blockReason: "WALK_IN",
          blockNote: "Wrong key",
          blockPhone: "",
          updatedAt: nowIso,
        })
      );
    }
  );

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}SLOTS SECURITY RULES TEST SUMMARY${RESET}`);
  console.log(`${BOLD}================================================================${RESET}`);

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Test Cases Executed: ${BOLD}${total}${RESET}`);
  console.log(`Passed: ${GREEN}${BOLD}${passed}${RESET}`);
  console.log(`Failed: ${failed > 0 ? RED + BOLD : GREEN}${failed}${RESET}`);

  await testEnv.cleanup();

  if (failed > 0) {
    console.log(`\n${RED}Failed Cases Details:${RESET}`);
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`  [${r.id}] ${r.description}\n    ${r.error}`));
    process.exit(1);
  } else {
    console.log(
      `\n${GREEN}${BOLD}ALL ${total} / ${total} SLOTS SECURITY TEST CASES PASSED IN EMULATOR! 🛡️${RESET}\n`
    );
    process.exit(0);
  }
}

runTestSuite().catch((e) => {
  console.error("Test execution runner crashed:", e);
  process.exit(1);
});
