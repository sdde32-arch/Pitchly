/**
 * TOUR-3e: Firestore Security Rules Comprehensive Test Suite
 *
 * Covers all 36 test cases across Suites A through E:
 * - Suite A: Tournament Ownership & Authorization (TC-A01 - TC-A07)
 * - Suite B: Tournament Lifecycle & 2-Day Grace Period (TC-B01 - TC-B07)
 * - Suite C: Tournament Contact Creation & Schema Validation (TC-C01 - TC-C10)
 * - Suite D: Contact Updates & Immutability (TC-D01 - TC-D07)
 * - Suite E: Contact Deletion & Privacy Boundaries (TC-E01 - TC-E05)
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
  Timestamp,
} from "firebase/firestore";
import * as fs from "fs";

// ANSI colors for clean test output
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
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

  console.log(`${BOLD}Seeding initial emulator fixtures...${RESET}`);

  // Seed baseline fixtures with rules disabled
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const now = new Date();

    // 1. Tournaments
    // Open approved tournament
    await setDoc(doc(db, "tournaments/tourn_open"), {
      id: "tourn_open",
      name: "Open Championship",
      organizerId: "user_org1",
      organizerName: "Organizer One",
      startDate: "2026-09-01",
      format: "knockout",
      venueText: "Lugogo Grounds",
      status: "approved",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    // Pending tournament
    await setDoc(doc(db, "tournaments/tourn_pending"), {
      id: "tourn_pending",
      name: "Pending Championship",
      organizerId: "user_org1",
      organizerName: "Organizer One",
      startDate: "2026-09-01",
      format: "knockout",
      venueText: "Lugogo Grounds",
      status: "pending",
      phase: "scheduled",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    // Completed tournament within 2-day grace period (completed 1 day ago)
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    await setDoc(doc(db, "tournaments/tourn_grace_active"), {
      id: "tourn_grace_active",
      name: "Active Grace Championship",
      organizerId: "user_org1",
      organizerName: "Organizer One",
      startDate: "2026-09-01",
      format: "knockout",
      venueText: "Lugogo Grounds",
      status: "approved",
      phase: "completed",
      completedAt: Timestamp.fromDate(oneDayAgo),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    // Completed tournament with expired grace period (completed 3 days ago)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    await setDoc(doc(db, "tournaments/tourn_grace_expired"), {
      id: "tourn_grace_expired",
      name: "Expired Grace Championship",
      organizerId: "user_org1",
      organizerName: "Organizer One",
      startDate: "2026-09-01",
      format: "knockout",
      venueText: "Lugogo Grounds",
      status: "approved",
      phase: "completed",
      completedAt: Timestamp.fromDate(threeDaysAgo),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    // Another organizer's tournament
    await setDoc(doc(db, "tournaments/tourn_other"), {
      id: "tourn_other",
      name: "Competitor Championship",
      organizerId: "user_org2",
      organizerName: "Organizer Two",
      startDate: "2026-09-01",
      format: "knockout",
      venueText: "Lugogo Grounds",
      status: "approved",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    // 2. Teams (in tournamentTeams)
    await setDoc(doc(db, "tournamentTeams/tm_1"), {
      id: "tm_1",
      tournamentId: "tourn_open",
      teamName: "Kampala Lions",
    });
    await setDoc(doc(db, "tournamentTeams/tm_create"), {
      id: "tm_create",
      tournamentId: "tourn_open",
      teamName: "Creation Team",
    });
    await setDoc(doc(db, "tournamentTeams/tm_pending"), {
      id: "tm_pending",
      tournamentId: "tourn_pending",
      teamName: "Jinja Tigers",
    });
    await setDoc(doc(db, "tournamentTeams/tm_grace"), {
      id: "tm_grace",
      tournamentId: "tourn_grace_active",
      teamName: "Gulu Panthers",
    });
    await setDoc(doc(db, "tournamentTeams/tm_expired"), {
      id: "tm_expired",
      tournamentId: "tourn_grace_expired",
      teamName: "Mbarara Cheetahs",
    });
    await setDoc(doc(db, "tournamentTeams/tm_expired_create"), {
      id: "tm_expired_create",
      tournamentId: "tourn_grace_expired",
      teamName: "Mbarara Lions",
    });
    await setDoc(doc(db, "tournamentTeams/tm_other"), {
      id: "tm_other",
      tournamentId: "tourn_other",
      teamName: "Entebbe Hawks",
    });

    // 3. Players (in tournamentPlayers)
    await setDoc(doc(db, "tournamentPlayers/ply_1"), {
      id: "ply_1",
      tournamentId: "tourn_open",
      playerName: "Paul Mukasa",
    });
    await setDoc(doc(db, "tournamentPlayers/ply_create"), {
      id: "ply_create",
      tournamentId: "tourn_open",
      playerName: "Creation Player",
    });
    await setDoc(doc(db, "tournamentPlayers/ply_pending"), {
      id: "ply_pending",
      tournamentId: "tourn_pending",
      playerName: "Peter Kigozi",
    });
    await setDoc(doc(db, "tournamentPlayers/ply_grace"), {
      id: "ply_grace",
      tournamentId: "tourn_grace_active",
      playerName: "Patrick Omondi",
    });
    await setDoc(doc(db, "tournamentPlayers/ply_expired"), {
      id: "ply_expired",
      tournamentId: "tourn_grace_expired",
      playerName: "Philip Kato",
    });

    // 4. Pre-existing contact records for reads, updates, and deletes
    await setDoc(doc(db, "tournamentContacts/tc_team_tm_1"), {
      id: "tc_team_tm_1",
      tournamentId: "tourn_open",
      type: "team",
      targetId: "tm_1",
      teamId: "tm_1",
      contactNumber: "+256 772 123 456",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    await setDoc(doc(db, "tournamentContacts/tc_team_tm_1_no_created_at"), {
      id: "tc_team_tm_1_no_created_at",
      tournamentId: "tourn_open",
      type: "team",
      targetId: "tm_1",
      teamId: "tm_1",
      contactNumber: "+256 772 123 456",
      updatedAt: now.toISOString(),
    });

    await setDoc(doc(db, "tournamentContacts/tc_team_tm_pending"), {
      id: "tc_team_tm_pending",
      tournamentId: "tourn_pending",
      type: "team",
      targetId: "tm_pending",
      teamId: "tm_pending",
      contactNumber: "+256 772 123 456",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    await setDoc(doc(db, "tournamentContacts/tc_team_tm_grace"), {
      id: "tc_team_tm_grace",
      tournamentId: "tourn_grace_active",
      type: "team",
      targetId: "tm_grace",
      teamId: "tm_grace",
      contactNumber: "+256 772 123 456",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    await setDoc(doc(db, "tournamentContacts/tc_team_tm_expired"), {
      id: "tc_team_tm_expired",
      tournamentId: "tourn_grace_expired",
      type: "team",
      targetId: "tm_expired",
      teamId: "tm_expired",
      contactNumber: "+256 772 123 456",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    await setDoc(doc(db, "tournamentContacts/tc_player_ply_1"), {
      id: "tc_player_ply_1",
      tournamentId: "tourn_open",
      type: "player",
      targetId: "ply_1",
      playerId: "ply_1",
      contactNumber: "+256 701 987 654",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  // Client Contexts
  const ownerContext = testEnv.authenticatedContext("user_org1");
  const otherOrgContext = testEnv.authenticatedContext("user_org2");
  const playerContext = testEnv.authenticatedContext("user_player1");
  const unauthContext = testEnv.unauthenticatedContext();
  const adminContext = testEnv.authenticatedContext("admin_user", { role: "admin" });

  const ownerDb = ownerContext.firestore();
  const otherOrgDb = otherOrgContext.firestore();
  const playerDb = playerContext.firestore();
  const unauthDb = unauthContext.firestore();
  const adminDb = adminContext.firestore();

  // ============================================================================
  // SUITE A: TOURNAMENT OWNERSHIP & AUTHORIZATION
  // ============================================================================
  printSuiteHeader("Suite A: Tournament Ownership & Authorization");

  await recordTest(
    "TC-A01",
    "Suite A",
    "Authorized tournament owner CAN read their tournament's private contact record",
    async () => {
      await assertSucceeds(getDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_1")));
    }
  );

  await recordTest(
    "TC-A02",
    "Suite A",
    "Authorized tournament owner CAN query their tournament's private contacts",
    async () => {
      const q = query(
        collection(ownerDb, "tournamentContacts"),
        where("tournamentId", "==", "tourn_open")
      );
      await assertSucceeds(getDocs(q));
    }
  );

  await recordTest(
    "TC-A03",
    "Suite A",
    "Different tournament organizer CANNOT read another organizer's contact record",
    async () => {
      await assertFails(getDoc(doc(otherOrgDb, "tournamentContacts/tc_team_tm_1")));
    }
  );

  await recordTest(
    "TC-A04",
    "Suite A",
    "Different tournament organizer CANNOT query another organizer's contacts",
    async () => {
      const q = query(
        collection(otherOrgDb, "tournamentContacts"),
        where("tournamentId", "==", "tourn_open")
      );
      await assertFails(getDocs(q));
    }
  );

  await recordTest(
    "TC-A05",
    "Suite A",
    "Regular authenticated player CANNOT read private tournament contact records",
    async () => {
      await assertFails(getDoc(doc(playerDb, "tournamentContacts/tc_team_tm_1")));
    }
  );

  await recordTest(
    "TC-A06",
    "Suite A",
    "Unauthenticated visitor CANNOT read private tournament contact records",
    async () => {
      await assertFails(getDoc(doc(unauthDb, "tournamentContacts/tc_team_tm_1")));
    }
  );

  await recordTest(
    "TC-A07",
    "Suite A",
    "Platform administrator CAN read private tournament contact records",
    async () => {
      await assertSucceeds(getDoc(doc(adminDb, "tournamentContacts/tc_team_tm_1")));
    }
  );

  // ============================================================================
  // SUITE B: TOURNAMENT LIFECYCLE & TWO-DAY GRACE PERIOD
  // ============================================================================
  printSuiteHeader("Suite B: Tournament Lifecycle & Two-Day Grace Period");

  await recordTest(
    "TC-B01",
    "Suite B",
    "Tournament owner CAN access contacts when tournament status is 'pending'",
    async () => {
      await assertSucceeds(getDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_pending")));
    }
  );

  await recordTest(
    "TC-B02",
    "Suite B",
    "Tournament owner CAN access contacts when tournament is approved and live",
    async () => {
      await assertSucceeds(getDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_1")));
    }
  );

  await recordTest(
    "TC-B03",
    "Suite B",
    "Tournament owner CAN access contacts within the 2-day completion grace period",
    async () => {
      await assertSucceeds(getDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_grace")));
    }
  );

  await recordTest(
    "TC-B04",
    "Suite B",
    "Tournament owner CANNOT read contacts after the 2-day grace period has expired",
    async () => {
      await assertFails(getDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_expired")));
    }
  );

  await recordTest(
    "TC-B05",
    "Suite B",
    "Tournament owner CANNOT update contacts after the 2-day grace period has expired",
    async () => {
      await assertFails(
        updateDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_expired"), {
          contactNumber: "+256 772 999 888",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-B06",
    "Suite B",
    "Tournament owner CANNOT delete contacts after the 2-day grace period has expired",
    async () => {
      await assertFails(deleteDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_expired")));
    }
  );

  await recordTest(
    "TC-B07",
    "Suite B",
    "Platform administrator RETAINS access after the 2-day grace period has expired",
    async () => {
      await assertSucceeds(getDoc(doc(adminDb, "tournamentContacts/tc_team_tm_expired")));
      await assertSucceeds(
        updateDoc(doc(adminDb, "tournamentContacts/tc_team_tm_expired"), {
          contactNumber: "+256 772 000 111",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  // ============================================================================
  // SUITE C: TOURNAMENT CONTACT CREATION & SCHEMA VALIDATION
  // ============================================================================
  printSuiteHeader("Suite C: Tournament Contact Creation & Schema Validation");

  await recordTest(
    "TC-C01",
    "Suite C",
    "Valid team contact creation succeeds with deterministic ID and valid schema",
    async () => {
      const now = new Date().toISOString();
      await assertSucceeds(
        setDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_create"), {
          id: "tc_team_tm_create",
          tournamentId: "tourn_open",
          type: "team",
          targetId: "tm_create",
          teamId: "tm_create",
          contactNumber: "+256 772 555 444",
          createdAt: now,
          updatedAt: now,
        })
      );
    }
  );

  await recordTest(
    "TC-C02",
    "Suite C",
    "Valid player contact creation succeeds with deterministic ID and valid schema",
    async () => {
      const now = new Date().toISOString();
      await assertSucceeds(
        setDoc(doc(ownerDb, "tournamentContacts/tc_player_ply_create"), {
          id: "tc_player_ply_create",
          tournamentId: "tourn_open",
          type: "player",
          targetId: "ply_create",
          playerId: "ply_create",
          contactNumber: "+256 701 333 222",
          createdAt: now,
          updatedAt: now,
        })
      );
    }
  );

  await recordTest(
    "TC-C03",
    "Suite C",
    "Contact creation FAILS if targetId is not a string (e.g. integer)",
    async () => {
      const now = new Date().toISOString();
      await assertFails(
        setDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_1"), {
          id: "tc_team_tm_1",
          tournamentId: "tourn_open",
          type: "team",
          targetId: 12345 as any,
          teamId: "tm_1",
          contactNumber: "+256 772 123 456",
          createdAt: now,
          updatedAt: now,
        })
      );
    }
  );

  await recordTest(
    "TC-C04",
    "Suite C",
    "Team contact creation FAILS if teamId is not a string (e.g. boolean)",
    async () => {
      const now = new Date().toISOString();
      await assertFails(
        setDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_1"), {
          id: "tc_team_tm_1",
          tournamentId: "tourn_open",
          type: "team",
          targetId: "tm_1",
          teamId: true as any,
          contactNumber: "+256 772 123 456",
          createdAt: now,
          updatedAt: now,
        })
      );
    }
  );

  await recordTest(
    "TC-C05",
    "Suite C",
    "Player contact creation FAILS if playerId is not a string (e.g. map/object)",
    async () => {
      const now = new Date().toISOString();
      await assertFails(
        setDoc(doc(ownerDb, "tournamentContacts/tc_player_ply_1"), {
          id: "tc_player_ply_1",
          tournamentId: "tourn_open",
          type: "player",
          targetId: "ply_1",
          playerId: { id: "ply_1" } as any,
          contactNumber: "+256 701 987 654",
          createdAt: now,
          updatedAt: now,
        })
      );
    }
  );

  await recordTest(
    "TC-C06",
    "Suite C",
    "Contact creation FAILS if doc ID is non-deterministic (not matching prefix)",
    async () => {
      const now = new Date().toISOString();
      await assertFails(
        setDoc(doc(ownerDb, "tournamentContacts/random_doc_id"), {
          id: "random_doc_id",
          tournamentId: "tourn_open",
          type: "team",
          targetId: "tm_1",
          teamId: "tm_1",
          contactNumber: "+256 772 123 456",
          createdAt: now,
          updatedAt: now,
        })
      );
    }
  );

  await recordTest(
    "TC-C07",
    "Suite C",
    "Contact creation FAILS if target team belongs to a different tournament",
    async () => {
      const now = new Date().toISOString();
      // tm_other belongs to tourn_other, not tourn_open
      await assertFails(
        setDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_other"), {
          id: "tc_team_tm_other",
          tournamentId: "tourn_open",
          type: "team",
          targetId: "tm_other",
          teamId: "tm_other",
          contactNumber: "+256 772 123 456",
          createdAt: now,
          updatedAt: now,
        })
      );
    }
  );

  await recordTest(
    "TC-C08",
    "Suite C",
    "Contact creation FAILS if contactNumber is too short (< 5 chars)",
    async () => {
      const now = new Date().toISOString();
      await assertFails(
        setDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_1"), {
          id: "tc_team_tm_1",
          tournamentId: "tourn_open",
          type: "team",
          targetId: "tm_1",
          teamId: "tm_1",
          contactNumber: "123",
          createdAt: now,
          updatedAt: now,
        })
      );
    }
  );

  await recordTest(
    "TC-C09",
    "Suite C",
    "Contact creation FAILS if contactNumber contains invalid letters/symbols",
    async () => {
      const now = new Date().toISOString();
      await assertFails(
        setDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_1"), {
          id: "tc_team_tm_1",
          tournamentId: "tourn_open",
          type: "team",
          targetId: "tm_1",
          teamId: "tm_1",
          contactNumber: "+256-CALL-ME-NOW",
          createdAt: now,
          updatedAt: now,
        })
      );
    }
  );

  await recordTest(
    "TC-C10",
    "Suite C",
    "Contact creation FAILS if unexpected extra/shadow fields are present",
    async () => {
      const now = new Date().toISOString();
      await assertFails(
        setDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_1"), {
          id: "tc_team_tm_1",
          tournamentId: "tourn_open",
          type: "team",
          targetId: "tm_1",
          teamId: "tm_1",
          contactNumber: "+256 772 123 456",
          createdAt: now,
          updatedAt: now,
          notes: "VIP team manager", // Forbidden ghost field
        })
      );
    }
  );

  // ============================================================================
  // SUITE D: CONTACT UPDATES & IMMUTABILITY
  // ============================================================================
  printSuiteHeader("Suite D: Contact Updates & Immutability");

  await recordTest(
    "TC-D01",
    "Suite D",
    "Authorized tournament owner CAN update permitted fields (contactNumber, updatedAt)",
    async () => {
      await assertSucceeds(
        updateDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_1"), {
          contactNumber: "+256 701 999 888",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-D02",
    "Suite D",
    "Update FAILS if attempting to modify 'createdAt' field",
    async () => {
      await assertFails(
        updateDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_1"), {
          createdAt: "2020-01-01T00:00:00.000Z",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-D03",
    "Suite D",
    "Update FAILS if attempting to inject 'createdAt' into doc originally lacking it",
    async () => {
      await assertFails(
        updateDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_1_no_created_at"), {
          createdAt: "2026-09-01T10:00:00Z",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-D04",
    "Suite D",
    "Update FAILS if attempting to modify 'tournamentId'",
    async () => {
      await assertFails(
        updateDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_1"), {
          tournamentId: "tourn_other",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-D05",
    "Suite D",
    "Update FAILS if attempting to modify 'type'",
    async () => {
      await assertFails(
        updateDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_1"), {
          type: "player",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-D06",
    "Suite D",
    "Update FAILS if attempting to modify 'targetId'",
    async () => {
      await assertFails(
        updateDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_1"), {
          targetId: "tm_other",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-D07",
    "Suite D",
    "Update FAILS if attempting to modify 'teamId' or 'playerId'",
    async () => {
      await assertFails(
        updateDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_1"), {
          teamId: "tm_other",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  // ============================================================================
  // SUITE E: CONTACT DELETION & PRIVACY
  // ============================================================================
  printSuiteHeader("Suite E: Contact Deletion & Privacy Boundaries");

  await recordTest(
    "TC-E01",
    "Suite E",
    "Authorized tournament owner CAN delete permitted contact record while open",
    async () => {
      await assertSucceeds(deleteDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_pending")));
    }
  );

  await recordTest(
    "TC-E02",
    "Suite E",
    "Platform administrator CAN delete contact record",
    async () => {
      await assertSucceeds(deleteDoc(doc(adminDb, "tournamentContacts/tc_player_ply_1")));
    }
  );

  await recordTest(
    "TC-E03",
    "Suite E",
    "Unauthorized organizer CANNOT delete another tournament's contact record",
    async () => {
      await assertFails(deleteDoc(doc(otherOrgDb, "tournamentContacts/tc_team_tm_1")));
    }
  );

  await recordTest(
    "TC-E04",
    "Suite E",
    "Regular authenticated player CANNOT delete contact record",
    async () => {
      await assertFails(deleteDoc(doc(playerDb, "tournamentContacts/tc_team_tm_1")));
    }
  );

  await recordTest(
    "TC-E05",
    "Suite E",
    "Unauthenticated visitor CANNOT delete contact record",
    async () => {
      await assertFails(deleteDoc(doc(unauthDb, "tournamentContacts/tc_team_tm_1")));
    }
  );

  // ============================================================================
  // SUITE F: ADDITIONAL SECURITY COVERAGE (TOUR-3g / TC-GAP01-TC-GAP04)
  // ============================================================================
  printSuiteHeader("Suite F: Additional Security Coverage Gaps");

  await recordTest(
    "TC-GAP01",
    "Suite F",
    "Unfiltered tournament contact collection query FAILS for tournament organizer",
    async () => {
      // An authenticated organizer queries the entire /tournamentContacts collection without
      // restricting it by tournamentId. Because Firestore security rules evaluate rules per-query,
      // and cannot guarantee all docs in the collection satisfy isTournamentOrganizer(),
      // an unfiltered collection query must fail.
      const q = query(collection(ownerDb, "tournamentContacts"));
      await assertFails(getDocs(q));
    }
  );

  await recordTest(
    "TC-GAP02",
    "Suite F",
    "Contact creation FAILS after tournament 2-day grace period has expired",
    async () => {
      // Tournament tourn_grace_expired completed > 2 days ago.
      // An organizer attempts to create a new contact record for a valid team in that tournament.
      // Because ownsOpenTournament() requires request.time < completedAt + 2d, creation must fail.
      const now = new Date().toISOString();
      await assertFails(
        setDoc(doc(ownerDb, "tournamentContacts/tc_team_tm_expired_create"), {
          id: "tc_team_tm_expired_create",
          tournamentId: "tourn_grace_expired",
          type: "team",
          targetId: "tm_expired_create",
          teamId: "tm_expired_create",
          contactNumber: "+256 772 111 222",
          createdAt: now,
          updatedAt: now,
        })
      );
    }
  );

  await recordTest(
    "TC-GAP03",
    "Suite F",
    "Player contact creation FAILS if referencing a non-existent player",
    async () => {
      // Structurally valid player contact with deterministic ID, but the referenced
      // playerId does not exist in /tournamentPlayers.
      // targetPlayerBelongsToTournament() fails, so creation must be denied.
      const now = new Date().toISOString();
      await assertFails(
        setDoc(doc(ownerDb, "tournamentContacts/tc_player_ply_non_existent"), {
          id: "tc_player_ply_non_existent",
          tournamentId: "tourn_open",
          type: "player",
          targetId: "ply_non_existent",
          playerId: "ply_non_existent",
          contactNumber: "+256 701 555 666",
          createdAt: now,
          updatedAt: now,
        })
      );
    }
  );

  await recordTest(
    "TC-GAP04",
    "Suite F",
    "Contact creation FAILS for mismatched contact type / ID and invalid contact type",
    async () => {
      const now = new Date().toISOString();
      // 1. Mismatched contact type: 'player' type submitted with 'tc_team_' document ID prefix
      await assertFails(
        setDoc(doc(ownerDb, "tournamentContacts/tc_team_ply_create"), {
          id: "tc_team_ply_create",
          tournamentId: "tourn_open",
          type: "player",
          targetId: "ply_create",
          playerId: "ply_create",
          contactNumber: "+256 701 333 222",
          createdAt: now,
          updatedAt: now,
        })
      );

      // 2. Invalid contact type: 'referee' is not in ['team', 'player']
      await assertFails(
        setDoc(doc(ownerDb, "tournamentContacts/tc_referee_ref_1"), {
          id: "tc_referee_ref_1",
          tournamentId: "tourn_open",
          type: "referee",
          targetId: "ref_1",
          contactNumber: "+256 701 333 222",
          createdAt: now,
          updatedAt: now,
        })
      );
    }
  );

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}FIRESTORE SECURITY RULES TEST SUMMARY${RESET}`);
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
    console.log(`\n${GREEN}${BOLD}ALL ${total} / ${total} SECURITY TEST CASES PASSED IN EMULATOR! 🛡️${RESET}\n`);
    process.exit(0);
  }
}

runTestSuite().catch((e) => {
  console.error("Test execution runner crashed:", e);
  process.exit(1);
});
