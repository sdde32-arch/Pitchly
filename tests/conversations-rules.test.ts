/**
 * Firestore Security Rules Test Suite for /conversations/{conversationId} and /messages/{messageId}
 *
 * Covers:
 * - Suite A: Real application payloads & authorized access (ALLOW)
 * - Suite B: Conversation creation abuse & schema boundaries (DENY)
 * - Suite C: Conversation update abuse & participant tampering boundaries (DENY)
 * - Suite D: Conversation & message read/list privacy boundaries (DENY)
 * - Suite E: Message create, edit, forgery, size, and delete boundaries (DENY)
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
  orderBy,
  arrayUnion,
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

const UID_CAPTAIN = "uid_captain_c";
const UID_MEMBER1 = "uid_member_m1";
const UID_OUTSIDER = "uid_outsider_o";
const UID_PLAYER = "uid_player_p";
const UID_OWNER = "uid_owner_w";
const UID_ADMIN = "admin_user";

function buildTeamDoc(teamId: string, nowIso: string) {
  return {
    id: teamId,
    name: "Kampala City FC",
    description: "Weekly 7-a-side squad",
    type: "7-a-side",
    location: "Kampala",
    logo: "",
    captainId: UID_CAPTAIN,
    ownerId: UID_CAPTAIN,
    createdAt: nowIso,
    updatedAt: nowIso,
    status: "ACTIVE",
    inviteCode: "KAMPAL-7F2A",
    inviteUrl: "https://pitchly.ug/teams/join/KAMPAL-7F2A",
    members: [
      {
        id: "m-capt-1001",
        userId: UID_CAPTAIN,
        name: "Captain Brian",
        contact: "+256700111111",
        isCaptain: true,
        role: "captain",
        hasPaid: true,
        joinedAt: nowIso,
      },
      {
        id: `m_${UID_MEMBER1}`,
        userId: UID_MEMBER1,
        name: "Dennis Mukasa",
        contact: "+256700222222",
        isCaptain: false,
        role: "player",
        hasPaid: false,
        avatar: "",
        joinedAt: nowIso,
        status: "active",
        paymentStatus: "pending",
      },
    ],
    memberIds: [UID_CAPTAIN, UID_MEMBER1],
  };
}

function buildTeamConvDoc(
  convId: string,
  participants: string[],
  nowIso: string,
  overrides: Record<string, any> = {}
) {
  return {
    id: convId,
    participants,
    type: "TEAM",
    name: "Kampala City FC Chat",
    createdAt: nowIso,
    updatedAt: nowIso,
    ...overrides,
  };
}

function buildDirectConvDoc(
  convId: string,
  participants: string[],
  nowIso: string,
  overrides: Record<string, any> = {}
) {
  return {
    id: convId,
    participants,
    type: "DIRECT",
    createdAt: nowIso,
    updatedAt: nowIso,
    ...overrides,
  };
}

function buildMessageDoc(
  msgId: string,
  conversationId: string,
  senderId: string,
  text: string,
  nowIso: string,
  extras: Record<string, any> = {}
) {
  return {
    id: msgId,
    conversationId,
    senderId,
    senderName: "Player Peter",
    senderAvatar: "https://ui-avatars.com/api/?name=Player+Peter&background=22C55E&color=fff&bold=true",
    text,
    createdAt: nowIso,
    ...extras,
  };
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

  console.log(`${BOLD}Seeding initial conversation & team fixtures...${RESET}`);

  const nowIso = new Date().toISOString();

  async function seedTeam(teamId: string) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, `teams/${teamId}`), buildTeamDoc(teamId, nowIso));
    });
  }

  async function seedConv(convId: string, data: Record<string, any>) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, `conversations/${convId}`), data);
    });
  }

  async function seedMessage(convId: string, msgId: string, data: Record<string, any>) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, `conversations/${convId}/messages/${msgId}`), data);
    });
  }

  // Core fixtures: T1 (with CT1 participants [C]), T2 (no conv yet), D1 [P, W] with message by P
  await seedTeam("team_t1");
  await seedConv("team_t1", buildTeamConvDoc("team_t1", [UID_CAPTAIN], nowIso));

  await seedTeam("team_t2"); // NO conversation yet
  await seedTeam("team_t2_m1"); // isolated copy for M1 create ALLOW

  await seedConv("conv_direct_d1", buildDirectConvDoc("conv_direct_d1", [UID_PLAYER, UID_OWNER], nowIso));
  await seedMessage(
    "conv_direct_d1",
    "msg_by_p",
    buildMessageDoc("msg_by_p", "conv_direct_d1", UID_PLAYER, "Hi, is 6pm free tonight?", nowIso)
  );

  // Client contexts
  const captainDb = testEnv.authenticatedContext(UID_CAPTAIN).firestore();
  const member1Db = testEnv.authenticatedContext(UID_MEMBER1).firestore();
  const outsiderDb = testEnv.authenticatedContext(UID_OUTSIDER).firestore();
  const playerDb = testEnv.authenticatedContext(UID_PLAYER).firestore();
  const ownerDb = testEnv.authenticatedContext(UID_OWNER).firestore();
  const adminDb = testEnv.authenticatedContext(UID_ADMIN, { role: "admin" }).firestore();

  // ============================================================================
  // SUITE A: REAL APPLICATION PAYLOADS & AUTHORIZED ACCESS (ALLOW)
  // ============================================================================
  printSuiteHeader("Suite A: Real Application Payloads & Authorized Access (ALLOW)");

  await recordTest(
    "TC-CV-A01",
    "Suite A",
    "Captain C CAN create TEAM conv for T2 with participants [C, M1] (exact createTeamConversation payload)",
    async () => {
      const t = new Date().toISOString();
      await assertSucceeds(
        setDoc(doc(captainDb, "conversations/team_t2"), {
          id: "team_t2",
          participants: [UID_CAPTAIN, UID_MEMBER1],
          type: "TEAM",
          name: "Kampala City FC Chat",
          createdAt: t,
          updatedAt: t,
        })
      );
    }
  );

  await recordTest(
    "TC-CV-A02",
    "Suite A",
    "Member M1 CAN create TEAM conv for team_t2_m1 (exact createTeamConversation payload)",
    async () => {
      const t = new Date().toISOString();
      await assertSucceeds(
        setDoc(doc(member1Db, "conversations/team_t2_m1"), {
          id: "team_t2_m1",
          participants: [UID_CAPTAIN, UID_MEMBER1],
          type: "TEAM",
          name: "Kampala City FC Chat",
          createdAt: t,
          updatedAt: t,
        })
      );
    }
  );

  await recordTest(
    "TC-CV-A03",
    "Suite A",
    "Member M1 (in team memberIds, not yet in participants) CAN join CT1 via arrayUnion payload",
    async () => {
      await assertSucceeds(
        updateDoc(doc(member1Db, "conversations/team_t1"), {
          participants: arrayUnion(UID_MEMBER1),
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-CV-A04",
    "Suite A",
    "Captain C (already in participants) CAN add missing roster id M1 to TEAM conv",
    async () => {
      await seedTeam("team_t1_c_sync");
      await seedConv("team_t1_c_sync", buildTeamConvDoc("team_t1_c_sync", [UID_CAPTAIN], nowIso));
      await assertSucceeds(
        updateDoc(doc(captainDb, "conversations/team_t1_c_sync"), {
          participants: arrayUnion(UID_MEMBER1),
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-CV-A05",
    "Suite A",
    "Participant P CAN send a message (exact sendMessage payload, with and without optional sender fields) and update lastMessage metadata",
    async () => {
      const msgTime = new Date().toISOString();
      await assertSucceeds(
        setDoc(
          doc(playerDb, "conversations/conv_direct_d1/messages/msg_p_002"),
          buildMessageDoc("msg_p_002", "conv_direct_d1", UID_PLAYER, "Confirming 7-a-side slot", msgTime)
        )
      );
      // Also allow omitting optional senderName / senderAvatar (as Firestore ignoreUndefinedProperties strips them)
      await assertSucceeds(
        setDoc(doc(playerDb, "conversations/conv_direct_d1/messages/msg_p_003"), {
          id: "msg_p_003",
          conversationId: "conv_direct_d1",
          senderId: UID_PLAYER,
          text: "No optional sender fields",
          createdAt: msgTime,
        })
      );
      await assertSucceeds(
        updateDoc(doc(playerDb, "conversations/conv_direct_d1"), {
          lastMessage: "Confirming 7-a-side slot",
          lastMessageAt: msgTime,
          lastMessageSenderName: "Player Peter",
          lastMessageSenderAvatar:
            "https://ui-avatars.com/api/?name=Player+Peter&background=22C55E&color=fff&bold=true",
          updatedAt: msgTime,
        })
      );
    }
  );

  await recordTest(
    "TC-CV-A06",
    "Suite A",
    "Player P CAN create a DIRECT conv (2 participants, exact getOrCreateDirectConversation payload)",
    async () => {
      const t = new Date().toISOString();
      await assertSucceeds(
        setDoc(doc(playerDb, "conversations/conv_direct_new"), {
          id: "conv_direct_new",
          participants: [UID_PLAYER, UID_OWNER],
          type: "DIRECT",
          turfName: "Arena 7 Ntinda",
          pitchId: "pitch_001",
          participantDetails: {
            [UID_PLAYER]: { name: "Player Peter", avatar: "", role: "Player" },
            [UID_OWNER]: { name: "Owner Walter", avatar: "https://example.com/owner.jpg", role: "Pitch Manager" },
          },
          createdAt: t,
          updatedAt: t,
        })
      );
    }
  );

  await recordTest(
    "TC-CV-A07",
    "Suite A",
    "Player P CAN update DIRECT conv with turfName/pitchId/participantDetails/updatedAt",
    async () => {
      await assertSucceeds(
        updateDoc(doc(playerDb, "conversations/conv_direct_d1"), {
          turfName: "Arena 7 Ntinda",
          pitchId: "pitch_001",
          participantDetails: {
            [UID_PLAYER]: { name: "Player Peter", avatar: "", role: "Player" },
            [UID_OWNER]: { name: "Owner Walter", role: "Owner" },
          },
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-CV-A08",
    "Suite A",
    "Participants P and W CAN read messages in D1",
    async () => {
      await assertSucceeds(getDoc(doc(playerDb, "conversations/conv_direct_d1/messages/msg_by_p")));
      await assertSucceeds(
        getDocs(
          query(
            collection(ownerDb, "conversations/conv_direct_d1/messages"),
            orderBy("createdAt", "asc")
          )
        )
      );
    }
  );

  await recordTest(
    "TC-CV-A09",
    "Suite A",
    "Participant P CAN run list query array-contains own uid",
    async () => {
      await assertSucceeds(
        getDocs(
          query(
            collection(playerDb, "conversations"),
            where("participants", "array-contains", UID_PLAYER)
          )
        )
      );
    }
  );

  await recordTest(
    "TC-CV-A10",
    "Suite A",
    "Admin CAN delete a conversation",
    async () => {
      await seedConv("conv_admin_del", buildDirectConvDoc("conv_admin_del", [UID_PLAYER, UID_OWNER], nowIso));
      await assertSucceeds(deleteDoc(doc(adminDb, "conversations/conv_admin_del")));
    }
  );

  await recordTest(
    "TC-CV-A11",
    "Suite A",
    "Admin CAN delete a message",
    async () => {
      await seedConv("conv_admin_msg_del", buildDirectConvDoc("conv_admin_msg_del", [UID_PLAYER, UID_OWNER], nowIso));
      await seedMessage(
        "conv_admin_msg_del",
        "msg_admin_del",
        buildMessageDoc("msg_admin_del", "conv_admin_msg_del", UID_PLAYER, "Moderation target", nowIso)
      );
      await assertSucceeds(deleteDoc(doc(adminDb, "conversations/conv_admin_msg_del/messages/msg_admin_del")));
    }
  );

  // ============================================================================
  // SUITE B: CONVERSATION CREATION ABUSE & SCHEMA BOUNDARIES (DENY)
  // ============================================================================
  printSuiteHeader("Suite B: Conversation Creation Abuse & Schema Boundaries (DENY)");

  await recordTest(
    "TC-CV-B01",
    "Suite B",
    "Outsider O CANNOT create TEAM conv for an existing team (T2 copy) including self",
    async () => {
      await seedTeam("team_deny_b01");
      const t = new Date().toISOString();
      await assertFails(
        setDoc(doc(outsiderDb, "conversations/team_deny_b01"), {
          id: "team_deny_b01",
          participants: [UID_OUTSIDER, UID_CAPTAIN],
          type: "TEAM",
          name: "Hijacked Team Chat",
          createdAt: t,
          updatedAt: t,
        })
      );
    }
  );

  await recordTest(
    "TC-CV-B02",
    "Suite B",
    "Outsider O CANNOT create TEAM conv for a team that does not exist",
    async () => {
      const t = new Date().toISOString();
      await assertFails(
        setDoc(doc(outsiderDb, "conversations/team_does_not_exist"), {
          id: "team_does_not_exist",
          participants: [UID_OUTSIDER],
          type: "TEAM",
          name: "Ghost Team Chat",
          createdAt: t,
          updatedAt: t,
        })
      );
    }
  );

  await recordTest(
    "TC-CV-B03",
    "Suite B",
    "Member M1 CANNOT create TEAM conv with a participant not in team memberIds",
    async () => {
      await seedTeam("team_deny_b03");
      const t = new Date().toISOString();
      await assertFails(
        setDoc(doc(member1Db, "conversations/team_deny_b03"), {
          id: "team_deny_b03",
          participants: [UID_CAPTAIN, UID_MEMBER1, UID_OUTSIDER],
          type: "TEAM",
          name: "Kampala City FC Chat",
          createdAt: t,
          updatedAt: t,
        })
      );
    }
  );

  await recordTest(
    "TC-CV-B04",
    "Suite B",
    "Signed-in user CANNOT create a GROUP conversation",
    async () => {
      const t = new Date().toISOString();
      await assertFails(
        setDoc(doc(playerDb, "conversations/conv_group_spam"), {
          id: "conv_group_spam",
          participants: [UID_PLAYER, UID_OWNER, UID_OUTSIDER],
          type: "GROUP",
          name: "Spam Group",
          createdAt: t,
          updatedAt: t,
        })
      );
    }
  );

  await recordTest(
    "TC-CV-B05",
    "Suite B",
    "Signed-in user CANNOT create a DIRECT conversation with 3 participants",
    async () => {
      const t = new Date().toISOString();
      await assertFails(
        setDoc(doc(playerDb, "conversations/conv_direct_three"), {
          id: "conv_direct_three",
          participants: [UID_PLAYER, UID_OWNER, UID_OUTSIDER],
          type: "DIRECT",
          createdAt: t,
          updatedAt: t,
        })
      );
    }
  );

  await recordTest(
    "TC-CV-B06",
    "Suite B",
    "Signed-in user CANNOT create a DIRECT conversation where caller is not in participants",
    async () => {
      const t = new Date().toISOString();
      await assertFails(
        setDoc(doc(outsiderDb, "conversations/conv_direct_spoof"), {
          id: "conv_direct_spoof",
          participants: [UID_PLAYER, UID_OWNER],
          type: "DIRECT",
          createdAt: t,
          updatedAt: t,
        })
      );
    }
  );

  // ============================================================================
  // SUITE C: CONVERSATION UPDATE ABUSE & PARTICIPANT TAMPERING (DENY)
  // ============================================================================
  printSuiteHeader("Suite C: Conversation Update Abuse & Participant Tampering (DENY)");

  await recordTest(
    "TC-CV-C01",
    "Suite C",
    "Plain participant CANNOT remove another participant (DIRECT or TEAM)",
    async () => {
      await seedConv("conv_deny_c01_direct", buildDirectConvDoc("conv_deny_c01_direct", [UID_PLAYER, UID_OWNER], nowIso));
      await assertFails(
        updateDoc(doc(playerDb, "conversations/conv_deny_c01_direct"), {
          participants: [UID_PLAYER],
          updatedAt: new Date().toISOString(),
        })
      );

      await seedTeam("team_deny_c01");
      await seedConv("team_deny_c01", buildTeamConvDoc("team_deny_c01", [UID_CAPTAIN, UID_MEMBER1], nowIso));
      await assertFails(
        updateDoc(doc(member1Db, "conversations/team_deny_c01"), {
          participants: [UID_MEMBER1],
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-CV-C02",
    "Suite C",
    "Participant CANNOT add a uid not in team memberIds to a TEAM conv",
    async () => {
      await seedTeam("team_deny_c02");
      await seedConv("team_deny_c02", buildTeamConvDoc("team_deny_c02", [UID_CAPTAIN], nowIso));
      await assertFails(
        updateDoc(doc(captainDb, "conversations/team_deny_c02"), {
          participants: arrayUnion(UID_OUTSIDER),
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-CV-C03",
    "Suite C",
    "Outsider O (non-member) CANNOT add self to team conversation CT1",
    async () => {
      await seedTeam("team_deny_c03");
      await seedConv("team_deny_c03", buildTeamConvDoc("team_deny_c03", [UID_CAPTAIN], nowIso));
      await assertFails(
        updateDoc(doc(outsiderDb, "conversations/team_deny_c03"), {
          participants: arrayUnion(UID_OUTSIDER),
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-CV-C04",
    "Suite C",
    "Participant CANNOT change type, name, or id on a conversation",
    async () => {
      await seedTeam("team_deny_c04");
      await seedConv("team_deny_c04", buildTeamConvDoc("team_deny_c04", [UID_CAPTAIN, UID_MEMBER1], nowIso));
      await assertFails(
        updateDoc(doc(captainDb, "conversations/team_deny_c04"), {
          type: "DIRECT",
          updatedAt: new Date().toISOString(),
        })
      );
      await assertFails(
        updateDoc(doc(captainDb, "conversations/team_deny_c04"), {
          name: "Renamed Chat",
          updatedAt: new Date().toISOString(),
        })
      );
      await assertFails(
        updateDoc(doc(captainDb, "conversations/team_deny_c04"), {
          id: "forged_conv_id",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-CV-C05",
    "Suite C",
    "Participant CANNOT mix participants + lastMessage keys in an update on a DIRECT conv",
    async () => {
      await seedConv("conv_deny_c05", buildDirectConvDoc("conv_deny_c05", [UID_PLAYER, UID_OWNER], nowIso));
      const t = new Date().toISOString();
      await assertFails(
        updateDoc(doc(playerDb, "conversations/conv_deny_c05"), {
          participants: [UID_PLAYER, UID_OWNER, UID_OUTSIDER],
          lastMessage: "Sneaky add",
          lastMessageAt: t,
          lastMessageSenderName: "Player Peter",
          lastMessageSenderAvatar: "",
          updatedAt: t,
        })
      );
    }
  );

  await recordTest(
    "TC-CV-C06",
    "Suite C",
    "Participant CANNOT update lastMessage with a non-string value",
    async () => {
      await seedConv("conv_deny_c06", buildDirectConvDoc("conv_deny_c06", [UID_PLAYER, UID_OWNER], nowIso));
      const t = new Date().toISOString();
      await assertFails(
        updateDoc(doc(playerDb, "conversations/conv_deny_c06"), {
          lastMessage: 12345 as any,
          lastMessageAt: t,
          lastMessageSenderName: "Player Peter",
          lastMessageSenderAvatar: "",
          updatedAt: t,
        })
      );
    }
  );

  // ============================================================================
  // SUITE D: CONVERSATION & MESSAGE READ / LIST PRIVACY BOUNDARIES (DENY)
  // ============================================================================
  printSuiteHeader("Suite D: Conversation & Message Read/List Privacy Boundaries (DENY)");

  await recordTest(
    "TC-CV-D01",
    "Suite D",
    "Non-participant O CANNOT read messages in D1",
    async () => {
      await assertFails(getDoc(doc(outsiderDb, "conversations/conv_direct_d1/messages/msg_by_p")));
      await assertFails(
        getDocs(
          query(
            collection(outsiderDb, "conversations/conv_direct_d1/messages"),
            orderBy("createdAt", "asc")
          )
        )
      );
    }
  );

  await recordTest(
    "TC-CV-D02",
    "Suite D",
    "Non-participant O CANNOT list someone else's conversations",
    async () => {
      await assertFails(
        getDocs(
          query(
            collection(outsiderDb, "conversations"),
            where("participants", "array-contains", UID_PLAYER)
          )
        )
      );
    }
  );

  // ============================================================================
  // SUITE E: MESSAGE CREATE, EDIT, FORGERY, SIZE, AND DELETE BOUNDARIES (DENY)
  // ============================================================================
  printSuiteHeader("Suite E: Message Create, Edit, Forgery, Size, and Delete Boundaries (DENY)");

  await recordTest(
    "TC-CV-E01",
    "Suite E",
    "Participant P CANNOT create a message with senderId != own uid",
    async () => {
      await assertFails(
        setDoc(
          doc(playerDb, "conversations/conv_direct_d1/messages/msg_deny_e01"),
          buildMessageDoc("msg_deny_e01", "conv_direct_d1", UID_OWNER, "Impersonating owner", nowIso)
        )
      );
    }
  );

  await recordTest(
    "TC-CV-E02",
    "Suite E",
    "Non-participant O CANNOT create a message in D1",
    async () => {
      await assertFails(
        setDoc(
          doc(outsiderDb, "conversations/conv_direct_d1/messages/msg_deny_e02"),
          buildMessageDoc("msg_deny_e02", "conv_direct_d1", UID_OUTSIDER, "Intruder message", nowIso)
        )
      );
    }
  );

  await recordTest(
    "TC-CV-E03",
    "Suite E",
    "Participant P CANNOT create a message with conversationId != path id",
    async () => {
      await assertFails(
        setDoc(
          doc(playerDb, "conversations/conv_direct_d1/messages/msg_deny_e03"),
          buildMessageDoc("msg_deny_e03", "other_conv_id", UID_PLAYER, "Mismatched convId", nowIso)
        )
      );
    }
  );

  await recordTest(
    "TC-CV-E04",
    "Suite E",
    "Participant P CANNOT create a message with empty text",
    async () => {
      await assertFails(
        setDoc(
          doc(playerDb, "conversations/conv_direct_d1/messages/msg_deny_e04"),
          buildMessageDoc("msg_deny_e04", "conv_direct_d1", UID_PLAYER, "", nowIso)
        )
      );
    }
  );

  await recordTest(
    "TC-CV-E05",
    "Suite E",
    "Participant P CANNOT create a message with text > 2000 chars",
    async () => {
      await assertFails(
        setDoc(
          doc(playerDb, "conversations/conv_direct_d1/messages/msg_deny_e05"),
          buildMessageDoc("msg_deny_e05", "conv_direct_d1", UID_PLAYER, "x".repeat(2001), nowIso)
        )
      );
    }
  );

  await recordTest(
    "TC-CV-E06",
    "Suite E",
    "Participant P CANNOT create a message with an extra unknown field",
    async () => {
      await assertFails(
        setDoc(
          doc(playerDb, "conversations/conv_direct_d1/messages/msg_deny_e06"),
          buildMessageDoc("msg_deny_e06", "conv_direct_d1", UID_PLAYER, "Valid text", nowIso, {
            isSystem: true,
          })
        )
      );
    }
  );

  await recordTest(
    "TC-CV-E07",
    "Suite E",
    "Participant P CANNOT create a message with senderAvatar > 1000 chars",
    async () => {
      await assertFails(
        setDoc(
          doc(playerDb, "conversations/conv_direct_d1/messages/msg_deny_e07"),
          buildMessageDoc("msg_deny_e07", "conv_direct_d1", UID_PLAYER, "Oversized avatar", nowIso, {
            senderAvatar: `https://example.com/${"a".repeat(985)}`,
          })
        )
      );
    }
  );

  await recordTest(
    "TC-CV-E08",
    "Suite E",
    "Participant P CANNOT update own message",
    async () => {
      await seedMessage(
        "conv_direct_d1",
        "msg_deny_e08",
        buildMessageDoc("msg_deny_e08", "conv_direct_d1", UID_PLAYER, "Original text", nowIso)
      );
      await assertFails(
        updateDoc(doc(playerDb, "conversations/conv_direct_d1/messages/msg_deny_e08"), {
          text: "Edited text",
        })
      );
    }
  );

  await recordTest(
    "TC-CV-E09",
    "Suite E",
    "Participant P CANNOT change senderId on own message",
    async () => {
      await seedMessage(
        "conv_direct_d1",
        "msg_deny_e09",
        buildMessageDoc("msg_deny_e09", "conv_direct_d1", UID_PLAYER, "Original sender", nowIso)
      );
      await assertFails(
        updateDoc(doc(playerDb, "conversations/conv_direct_d1/messages/msg_deny_e09"), {
          senderId: UID_OWNER,
        })
      );
    }
  );

  await recordTest(
    "TC-CV-E10",
    "Suite E",
    "Participant P CANNOT delete own message",
    async () => {
      await seedMessage(
        "conv_direct_d1",
        "msg_deny_e10",
        buildMessageDoc("msg_deny_e10", "conv_direct_d1", UID_PLAYER, "Cannot self-delete", nowIso)
      );
      await assertFails(deleteDoc(doc(playerDb, "conversations/conv_direct_d1/messages/msg_deny_e10")));
    }
  );

  await recordTest(
    "TC-CV-E11",
    "Suite E",
    "Non-admin (other participant W and outsider O) CANNOT delete any message",
    async () => {
      await seedMessage(
        "conv_direct_d1",
        "msg_deny_e11",
        buildMessageDoc("msg_deny_e11", "conv_direct_d1", UID_PLAYER, "Protected message", nowIso)
      );
      await assertFails(deleteDoc(doc(ownerDb, "conversations/conv_direct_d1/messages/msg_deny_e11")));
      await assertFails(deleteDoc(doc(outsiderDb, "conversations/conv_direct_d1/messages/msg_deny_e11")));
    }
  );

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}CONVERSATIONS SECURITY RULES TEST SUMMARY${RESET}`);
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
      `\n${GREEN}${BOLD}ALL ${total} / ${total} CONVERSATIONS SECURITY TEST CASES PASSED IN EMULATOR! 🛡️${RESET}\n`
    );
    process.exit(0);
  }
}

runTestSuite().catch((e) => {
  console.error("Test execution runner crashed:", e);
  process.exit(1);
});
