/**
 * Firestore Security Rules Test Suite for /notifications/{notificationId}
 *
 * Covers:
 * - Suite A: Real application notification payload shapes (ALLOW)
 * - Suite B: Abusive, malformed, and schema-violating creates (DENY)
 * - Suite C: Addressee-only read, update (mark as read), and delete boundaries
 */

import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
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

  console.log(`${BOLD}Seeding initial notification fixtures...${RESET}`);

  const nowIso = new Date().toISOString();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, "notifications/notif_seed_read_update"), {
      id: "notif_seed_read_update",
      userId: "user_player1",
      type: "SYSTEM",
      title: "Payment confirmed",
      body: "Your booking at Lugogo Arena on 2026-11-20 18:00 is confirmed.",
      message: "Your booking at Lugogo Arena on 2026-11-20 18:00 is confirmed.",
      bookingId: "bk_seed_1",
      pitchId: "pitch_seed_1",
      link: "/booking-confirmation/bk_seed_1",
      read: false,
      isRead: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    await setDoc(doc(db, "notifications/notif_seed_delete"), {
      id: "notif_seed_delete",
      userId: "user_player1",
      type: "MATCH_INVITE",
      title: "Match Proposal Cancelled",
      body: "The match proposal for Lugogo Arena on 2026-11-20 has been cancelled.",
      isRead: false,
      link: "/invitations",
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  });

  // Client Contexts
  const playerContext = testEnv.authenticatedContext("user_player1");
  const bumpedPlayerContext = testEnv.authenticatedContext("user_player2");
  const ownerContext = testEnv.authenticatedContext("user_owner1");
  const strangerContext = testEnv.authenticatedContext("user_stranger");
  const adminContext = testEnv.authenticatedContext("admin_user", { role: "admin" });
  const unauthContext = testEnv.unauthenticatedContext();

  const playerDb = playerContext.firestore();
  const bumpedPlayerDb = bumpedPlayerContext.firestore();
  const ownerDb = ownerContext.firestore();
  const strangerDb = strangerContext.firestore();
  const adminDb = adminContext.firestore();
  const unauthDb = unauthContext.firestore();

  // ============================================================================
  // SUITE A: REAL PAYLOAD SHAPES (ALLOW)
  // ============================================================================
  printSuiteHeader("Suite A: Real Application Notification Payload Shapes (ALLOW)");

  await recordTest(
    "TC-NTF-A01",
    "Suite A",
    "Player to owner new booking notification (pages/BookPitch.tsx)",
    async () => {
      const id = "notif_allow_new_booking";
      await assertSucceeds(
        setDoc(doc(playerDb, `notifications/${id}`), {
          id,
          userId: "user_owner1",
          type: "SYSTEM",
          title: "New booking request",
          body: "Brian · 2026-11-20 18:00 · Lugogo Arena",
          message: "Brian · 2026-11-20 18:00 · Lugogo Arena",
          bookingId: "bk_101",
          pitchId: "pitch_1",
          link: "/owner",
          read: false,
          isRead: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-NTF-A02",
    "Suite A",
    "Preemption BOOKING_PREEMPTED notice to bumped player without link (services/bookingService.ts)",
    async () => {
      const id = "notif_allow_preempted";
      const msg =
        "Your unpaid reservation at Lugogo Arena on 2026-11-20 18:00 was taken by a player who paid a deposit. Your other reserved hours at that pitch were released.";
      await assertSucceeds(
        setDoc(doc(playerDb, `notifications/${id}`), {
          id,
          userId: "user_player2",
          type: "BOOKING_PREEMPTED",
          title: "Your unpaid reservation was taken",
          message: msg,
          body: msg,
          bookingId: "bk_bumped_1",
          pitchId: "pitch_1",
          read: false,
          isRead: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-NTF-A03",
    "Suite A",
    "Tentative booking upgrade notice from player to owner (services/bookingService.ts)",
    async () => {
      const id = "notif_allow_upgrade";
      const bodyMsg = "Brian · 2026-11-20 18:00 · Lugogo Arena";
      await assertSucceeds(
        setDoc(doc(playerDb, `notifications/${id}`), {
          id,
          userId: "user_owner1",
          type: "SYSTEM",
          title: "Payment proof submitted",
          body: bodyMsg,
          message: bodyMsg,
          bookingId: "bk_102",
          pitchId: "pitch_1",
          link: "/owner",
          read: false,
          isRead: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-NTF-A04",
    "Suite A",
    "Owner confirms unpaid hold notice to player without link (services/bookingService.ts)",
    async () => {
      const id = "notif_allow_owner_confirm_hold";
      const msg = "Lugogo Arena on 2026-11-20 18:00 is confirmed. Pay UGX 120,000 at the pitch.";
      await assertSucceeds(
        setDoc(doc(ownerDb, `notifications/${id}`), {
          id,
          userId: "user_player1",
          type: "SYSTEM",
          title: "Reservation confirmed",
          message: msg,
          body: msg,
          bookingId: "bk_103",
          pitchId: "pitch_1",
          read: false,
          isRead: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-NTF-A05",
    "Suite A",
    "Owner declines unpaid hold notice to player without link (services/bookingService.ts)",
    async () => {
      const id = "notif_allow_owner_decline_hold";
      const msg = "Your reservation at Lugogo Arena on 2026-11-20 was declined by the owner.";
      await assertSucceeds(
        setDoc(doc(ownerDb, `notifications/${id}`), {
          id,
          userId: "user_player1",
          type: "SYSTEM",
          title: "Reservation declined",
          message: msg,
          body: msg,
          bookingId: "bk_104",
          pitchId: "pitch_1",
          read: false,
          isRead: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-NTF-A06",
    "Suite A",
    "Owner decision (APPROVED / DECLINED / CANCELLED) with bookingId and pitchId (services/bookingService.ts)",
    async () => {
      const idApprove = "notif_allow_decision_approve";
      await assertSucceeds(
        setDoc(doc(ownerDb, `notifications/${idApprove}`), {
          id: idApprove,
          userId: "user_player1",
          type: "SYSTEM",
          title: "Payment confirmed",
          body: "Your booking at Lugogo Arena on 2026-11-20 18:00 is confirmed.",
          message: "Your booking at Lugogo Arena on 2026-11-20 18:00 is confirmed.",
          bookingId: "bk_105",
          pitchId: "pitch_1",
          link: "/booking-confirmation/bk_105",
          read: false,
          isRead: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );

      const idDecline = "notif_allow_decision_decline";
      await assertSucceeds(
        setDoc(doc(ownerDb, `notifications/${idDecline}`), {
          id: idDecline,
          userId: "user_player1",
          type: "SYSTEM",
          title: "Payment not accepted",
          body: "The pitch owner could not verify your payment for Lugogo Arena on 2026-11-20 18:00. Open your booking or contact the owner.",
          message: "The pitch owner could not verify your payment for Lugogo Arena on 2026-11-20 18:00. Open your booking or contact the owner.",
          bookingId: "bk_106",
          pitchId: "pitch_1",
          link: "/booking-confirmation/bk_106",
          read: false,
          isRead: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-NTF-A07",
    "Suite A",
    "Owner decision (CANCELLED) without optional bookingId and pitchId (services/bookingService.ts)",
    async () => {
      const id = "notif_allow_decision_no_ids";
      const body = "Lugogo Arena on 2026-11-20 18:00 was cancelled by the pitch owner.";
      await assertSucceeds(
        setDoc(doc(ownerDb, `notifications/${id}`), {
          id,
          userId: "user_player1",
          type: "SYSTEM",
          title: "Booking cancelled by owner",
          body,
          message: body,
          link: "/bookings",
          read: false,
          isRead: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-NTF-A08",
    "Suite A",
    "Cutoff-sweep notices to player and to owner without link (services/bookingService.ts)",
    async () => {
      const idPlayer = "notif_allow_cutoff_player";
      const playerMsg =
        "Your booking at Lugogo Arena on 2026-11-20 18:00 was cancelled because the owner did not confirm the payment in time.";
      await assertSucceeds(
        setDoc(doc(playerDb, `notifications/${idPlayer}`), {
          id: idPlayer,
          userId: "user_player1",
          type: "SYSTEM",
          title: "Booking cancelled",
          message: playerMsg,
          body: playerMsg,
          bookingId: "bk_107",
          pitchId: "pitch_1",
          read: false,
          isRead: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );

      const idOwner = "notif_allow_cutoff_owner";
      const ownerMsg = "Unconfirmed booking by Brian on 2026-11-20 18:00 was cancelled automatically.";
      await assertSucceeds(
        setDoc(doc(playerDb, `notifications/${idOwner}`), {
          id: idOwner,
          userId: "user_owner1",
          type: "SYSTEM",
          title: "Unconfirmed booking cancelled",
          message: ownerMsg,
          body: ownerMsg,
          bookingId: "bk_107",
          pitchId: "pitch_1",
          read: false,
          isRead: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-NTF-A09",
    "Suite A",
    "Admin pitch approve / reject / changes / inspection notices to owner without bookingId (services/adminService.ts)",
    async () => {
      const cases = [
        {
          id: "notif_allow_admin_approve",
          title: "Your pitch is live",
          msg: "Lugogo Arena has been approved and is now active for player reservations.",
        },
        {
          id: "notif_allow_admin_reject",
          title: "Pitch not approved",
          msg: "Lugogo Arena was not approved: Photos of floodlights are missing.",
        },
        {
          id: "notif_allow_admin_changes",
          title: "Changes requested",
          msg: "Changes were requested for Lugogo Arena: Please update your mobile money payout number.",
        },
        {
          id: "notif_allow_admin_inspect",
          title: "Stage 1 approved",
          msg: "Lugogo Arena: Stage 1 approved — your pitch details were approved. A physical inspection will be scheduled next.",
        },
      ];

      for (const c of cases) {
        await assertSucceeds(
          setDoc(doc(adminDb, `notifications/${c.id}`), {
            id: c.id,
            userId: "user_owner1",
            type: "SYSTEM",
            title: c.title,
            body: c.msg,
            message: c.msg,
            pitchId: "pitch_1",
            link: "/owner/pitches",
            read: false,
            isRead: false,
            createdAt: nowIso,
            updatedAt: nowIso,
          })
        );
      }
    }
  );

  await recordTest(
    "TC-NTF-A10",
    "Suite A",
    "Match-invitation MATCH_INVITE notices without read, message, bookingId, or pitchId (services/matchInvitationService.ts)",
    async () => {
      const inviteId = "inv_101";
      const inviteNotifId = `notif_${inviteId}_user_player2_${Date.now()}`;
      await assertSucceeds(
        setDoc(doc(playerDb, `notifications/${inviteNotifId}`), {
          id: inviteNotifId,
          userId: "user_player2",
          title: "Matchday Invitation ⚽",
          body: "Brian proposed a game at Lugogo Arena on 2026-11-22 at 19:00. Attendance is free — confirm your spot!",
          type: "MATCH_INVITE",
          isRead: false,
          link: `/invitations?id=${inviteId}`,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );

      const allConfId = `notif_allconf_${inviteId}_${Date.now()}`;
      await assertSucceeds(
        setDoc(doc(bumpedPlayerDb, `notifications/${allConfId}`), {
          id: allConfId,
          userId: "user_player1",
          title: "Squad Full — Book Your Slot Now! ⚡",
          body: "All 10 players have confirmed for Lugogo Arena on 2026-11-22 (19:00). Pay the deposit now to secure the pitch!",
          type: "MATCH_INVITE",
          isRead: false,
          link: `/invitations?id=${inviteId}`,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );

      const cancelId = `notif_cancel_${inviteId}_user_player2_${Date.now()}`;
      await assertSucceeds(
        setDoc(doc(playerDb, `notifications/${cancelId}`), {
          id: cancelId,
          userId: "user_player2",
          title: "Match Proposal Cancelled",
          body: "The match proposal for Lugogo Arena on 2026-11-22 has been cancelled.",
          type: "MATCH_INVITE",
          isRead: false,
          link: "/invitations",
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  await recordTest(
    "TC-NTF-A11",
    "Suite A",
    "Booking reminder BOOKING_REMINDER from matchInvitationService without read, message, bookingId, pitchId",
    async () => {
      const id = `notif_booked_inv_101_user_player2_${Date.now()}`;
      await assertSucceeds(
        setDoc(doc(playerDb, `notifications/${id}`), {
          id,
          userId: "user_player2",
          title: "Pitch Officially Booked! 🎉",
          body: "The match at Lugogo Arena on 2026-11-22 (19:00) is locked and confirmed. See you on the pitch!",
          type: "BOOKING_REMINDER",
          isRead: false,
          link: "/bookings",
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );
    }
  );

  // ============================================================================
  // SUITE B: MALFORMED & ABUSIVE CREATES (DENY)
  // ============================================================================
  printSuiteHeader("Suite B: Malformed & Abusive Notification Creates (DENY)");

  const baseValid = (id: string) => ({
    id,
    userId: "user_player1",
    type: "SYSTEM",
    title: "Valid title",
    body: "Valid notification body.",
    isRead: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  await recordTest("TC-NTF-B01", "Suite B", "Unauthenticated create FAILS", async () => {
    const id = "notif_deny_unauth";
    await assertFails(setDoc(doc(unauthDb, `notifications/${id}`), baseValid(id)));
  });

  await recordTest("TC-NTF-B02", "Suite B", "Unlisted type FAILS", async () => {
    const id = "notif_deny_unlisted_type";
    await assertFails(
      setDoc(doc(strangerDb, `notifications/${id}`), {
        ...baseValid(id),
        type: "ADMIN_BROADCAST",
      })
    );
  });

  await recordTest("TC-NTF-B03", "Suite B", "Extra unknown field FAILS", async () => {
    const id = "notif_deny_extra_field";
    await assertFails(
      setDoc(doc(strangerDb, `notifications/${id}`), {
        ...baseValid(id),
        spoofedSender: "Pitchly",
      })
    );
  });

  await recordTest("TC-NTF-B04", "Suite B", "Title over 120 chars FAILS", async () => {
    const id = "notif_deny_title_long";
    await assertFails(
      setDoc(doc(strangerDb, `notifications/${id}`), {
        ...baseValid(id),
        title: "A".repeat(121),
      })
    );
  });

  await recordTest("TC-NTF-B05", "Suite B", "Body over 1000 chars FAILS", async () => {
    const id = "notif_deny_body_long";
    await assertFails(
      setDoc(doc(strangerDb, `notifications/${id}`), {
        ...baseValid(id),
        body: "B".repeat(1001),
      })
    );
  });

  await recordTest("TC-NTF-B06", "Suite B", "Link not starting with '/' FAILS", async () => {
    const id = "notif_deny_relative_link";
    await assertFails(
      setDoc(doc(strangerDb, `notifications/${id}`), {
        ...baseValid(id),
        link: "owner/pitches",
      })
    );
  });

  await recordTest("TC-NTF-B07", "Suite B", "External URL in link FAILS", async () => {
    const id = "notif_deny_external_link";
    await assertFails(
      setDoc(doc(strangerDb, `notifications/${id}`), {
        ...baseValid(id),
        link: "https://evil.example/phish",
      })
    );
  });

  await recordTest("TC-NTF-B08", "Suite B", "Pre-read isRead: true FAILS", async () => {
    const id = "notif_deny_isread_true";
    await assertFails(
      setDoc(doc(strangerDb, `notifications/${id}`), {
        ...baseValid(id),
        isRead: true,
      })
    );
  });

  await recordTest("TC-NTF-B09", "Suite B", "Pre-read read: true FAILS", async () => {
    const id = "notif_deny_read_true";
    await assertFails(
      setDoc(doc(strangerDb, `notifications/${id}`), {
        ...baseValid(id),
        read: true,
      })
    );
  });

  await recordTest("TC-NTF-B10", "Suite B", "Mismatched id != document id FAILS", async () => {
    const id = "notif_deny_mismatch_doc";
    await assertFails(
      setDoc(doc(strangerDb, `notifications/${id}`), {
        ...baseValid(id),
        id: "different_id",
      })
    );
  });

  await recordTest("TC-NTF-B11", "Suite B", "Empty userId FAILS", async () => {
    const id = "notif_deny_empty_userid";
    await assertFails(
      setDoc(doc(strangerDb, `notifications/${id}`), {
        ...baseValid(id),
        userId: "",
      })
    );
  });

  await recordTest("TC-NTF-B12", "Suite B", "Missing required field (no title) FAILS", async () => {
    const id = "notif_deny_no_title";
    const { title: _omitted, ...withoutTitle } = baseValid(id);
    await assertFails(setDoc(doc(strangerDb, `notifications/${id}`), withoutTitle));
  });

  await recordTest("TC-NTF-B13", "Suite B", "Wrong type for title (number) FAILS", async () => {
    const id = "notif_deny_title_type";
    await assertFails(
      setDoc(doc(strangerDb, `notifications/${id}`), {
        ...baseValid(id),
        title: 12345 as any,
      })
    );
  });

  // ============================================================================
  // SUITE C: ADDRESSEE-ONLY READ, UPDATE, AND DELETE
  // ============================================================================
  printSuiteHeader("Suite C: Addressee-Only Read, Update, and Delete Boundaries");

  await recordTest(
    "TC-NTF-C01",
    "Suite C",
    "Addressee CAN read, query own notifications, mark read (update), and delete",
    async () => {
      await assertSucceeds(getDoc(doc(playerDb, "notifications/notif_seed_read_update")));

      const ownQuery = query(
        collection(playerDb, "notifications"),
        where("userId", "==", "user_player1")
      );
      await assertSucceeds(getDocs(ownQuery));

      await assertSucceeds(
        updateDoc(doc(playerDb, "notifications/notif_seed_read_update"), {
          isRead: true,
          read: true,
          updatedAt: new Date().toISOString(),
        })
      );

      await assertSucceeds(deleteDoc(doc(playerDb, "notifications/notif_seed_delete")));
    }
  );

  await recordTest(
    "TC-NTF-C02",
    "Suite C",
    "Different signed-in user CANNOT read, update, or delete another user's notification",
    async () => {
      await assertFails(getDoc(doc(strangerDb, "notifications/notif_seed_read_update")));
      await assertFails(
        updateDoc(doc(strangerDb, "notifications/notif_seed_read_update"), {
          isRead: true,
          read: true,
          updatedAt: new Date().toISOString(),
        })
      );
      await assertFails(deleteDoc(doc(strangerDb, "notifications/notif_seed_read_update")));
    }
  );

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}NOTIFICATIONS SECURITY RULES TEST SUMMARY${RESET}`);
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
      `\n${GREEN}${BOLD}ALL ${total} / ${total} NOTIFICATION SECURITY TEST CASES PASSED IN EMULATOR! 🛡️${RESET}\n`
    );
    process.exit(0);
  }
}

runTestSuite().catch((e) => {
  console.error("Test execution runner crashed:", e);
  process.exit(1);
});
