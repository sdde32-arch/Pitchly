/**
 * Firestore Security Rules Test Suite for /teams/{teamId}
 *
 * Covers:
 * - Suite A: Real application squad payloads & authorized access (ALLOW)
 * - Suite B: Unauthenticated, non-captain member, create, and delete boundaries (DENY)
 * - Suite C: Outsider non-join edits and join privilege-escalation / abuse (DENY)
 * - Suite D: Squad creation integrity boundaries (DENY)
 * - Suite E: Join member entry shape & field validation boundaries (DENY)
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
const UID_OTHER = "uid_other_player";
const UID_ADMIN = "admin_user";

function buildBaseMembers(nowIso: string) {
  return [
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
  ];
}

function buildSeedTeam(teamId: string, nowIso: string, overrides: Record<string, any> = {}) {
  return {
    id: teamId,
    name: "Kampala City FC",
    description: "Weekly 7-a-side squad in Ntinda",
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
    members: buildBaseMembers(nowIso),
    memberIds: [UID_CAPTAIN, UID_MEMBER1],
    ...overrides,
  };
}

function buildJoinMember(uid: string, nowIso: string, overrides: Record<string, any> = {}) {
  return {
    id: `m_${uid}`,
    userId: uid,
    name: "Outsider Alex",
    contact: "+256700333333",
    isCaptain: false,
    role: "player",
    hasPaid: false,
    avatar: "",
    joinedAt: nowIso,
    status: "active",
    paymentStatus: "pending",
    ...overrides,
  };
}

function buildCreateTeamPayload(
  teamId: string,
  captainUid: string,
  nowIso: string,
  overrides: Record<string, any> = {}
) {
  return {
    id: teamId,
    name: "Ntinda United",
    description: "Friday night 7-a-side",
    type: "7-a-side",
    location: "Kampala",
    logo: "",
    captainId: captainUid,
    ownerId: captainUid,
    createdAt: nowIso,
    updatedAt: nowIso,
    status: "ACTIVE",
    inviteCode: "NTINDA-9X2K",
    inviteUrl: "https://pitchly.ug/teams/join/NTINDA-9X2K",
    members: [
      {
        id: "m-capt-9999",
        name: "Captain Brian",
        contact: "+256700111111",
        isCaptain: true,
        role: "captain",
        hasPaid: true,
        userId: captainUid,
        joinedAt: nowIso,
      },
    ],
    memberIds: [captainUid],
    ...overrides,
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

  console.log(`${BOLD}Seeding initial team fixtures...${RESET}`);

  const nowIso = new Date().toISOString();

  async function seedTeam(teamId: string, overrides: Record<string, any> = {}) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, `teams/${teamId}`), buildSeedTeam(teamId, nowIso, overrides));
    });
  }

  // Primary seeded ACTIVE team (plus isolated copies so RED-run holes do not cascade)
  await seedTeam("team_seed_active");
  await seedTeam("team_seed_join_allow");
  await seedTeam("team_seed_admin_update");
  await seedTeam("team_seed_disbanded", { status: "DISBANDED" });

  // Client Contexts
  const captainDb = testEnv.authenticatedContext(UID_CAPTAIN).firestore();
  const member1Db = testEnv.authenticatedContext(UID_MEMBER1).firestore();
  const outsiderDb = testEnv.authenticatedContext(UID_OUTSIDER).firestore();
  const adminDb = testEnv.authenticatedContext(UID_ADMIN, { role: "admin" }).firestore();
  const unauthDb = testEnv.unauthenticatedContext().firestore();

  // ============================================================================
  // SUITE A: REAL PAYLOAD SHAPES & AUTHORIZED OPERATIONS (ALLOW)
  // ============================================================================
  printSuiteHeader("Suite A: Real Application Squad Payloads & Authorized Access (ALLOW)");

  await recordTest(
    "TC-TM-A01",
    "Suite A",
    "Anyone (unauthenticated visitor and authenticated outsider) CAN read a team",
    async () => {
      await assertSucceeds(getDoc(doc(unauthDb, "teams/team_seed_active")));
      await assertSucceeds(getDoc(doc(outsiderDb, "teams/team_seed_active")));
    }
  );

  await recordTest(
    "TC-TM-A02",
    "Suite A",
    "Captain C CAN create a team with captainId == own uid (exact teamService.create payload)",
    async () => {
      const newTeamId = "team_created_by_c";
      const createdNow = new Date().toISOString();
      await assertSucceeds(
        setDoc(doc(captainDb, `teams/${newTeamId}`), {
          id: newTeamId,
          name: "Ntinda United",
          description: "Friday night 7-a-side",
          type: "7-a-side",
          location: "Kampala",
          logo: "",
          captainId: UID_CAPTAIN,
          ownerId: UID_CAPTAIN,
          createdAt: createdNow,
          updatedAt: createdNow,
          status: "ACTIVE",
          inviteCode: "NTINDA-9X2K",
          inviteUrl: "https://pitchly.ug/teams/join/NTINDA-9X2K",
          members: [
            {
              id: "m-capt-9999",
              name: "Captain Brian",
              contact: "+256700111111",
              isCaptain: true,
              role: "captain",
              hasPaid: true,
              userId: UID_CAPTAIN,
              joinedAt: createdNow,
            },
          ],
          memberIds: [UID_CAPTAIN],
        })
      );
    }
  );

  await recordTest(
    "TC-TM-A03",
    "Suite A",
    "Captain C CAN edit description and regenerate inviteCode/inviteUrl/updatedAt (exact regenerateInviteCode payload)",
    async () => {
      await assertSucceeds(
        updateDoc(doc(captainDb, "teams/team_seed_active"), {
          description: "Updated squad motto for new season",
          updatedAt: new Date().toISOString(),
        })
      );
      await assertSucceeds(
        updateDoc(doc(captainDb, "teams/team_seed_active"), {
          inviteCode: "KAMPAL-9Z4B",
          inviteUrl: "https://pitchly.ug/teams/join/KAMPAL-9Z4B",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-TM-A04",
    "Suite A",
    "Outsider O CAN join ACTIVE team with exact teamService.joinByInviteCode payload",
    async () => {
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const newMember = buildJoinMember(UID_OUTSIDER, joinNow);
      await assertSucceeds(
        updateDoc(doc(outsiderDb, "teams/team_seed_join_allow"), {
          members: [...baseMembers, newMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-A05",
    "Suite A",
    "Admin CAN update a team",
    async () => {
      await assertSucceeds(
        updateDoc(doc(adminDb, "teams/team_seed_admin_update"), {
          status: "DISBANDED",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-TM-A06",
    "Suite A",
    "Outsider O CAN join ACTIVE team with real ui-avatars https:// URL or empty-string avatar",
    async () => {
      await seedTeam("team_seed_join_avatar_url");
      await seedTeam("team_seed_join_avatar_empty");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);

      const urlMember = buildJoinMember(UID_OUTSIDER, joinNow, {
        avatar: "https://ui-avatars.com/api/?name=Outsider+Alex&background=22C55E&color=fff&bold=true",
      });
      await assertSucceeds(
        updateDoc(doc(outsiderDb, "teams/team_seed_join_avatar_url"), {
          members: [...baseMembers, urlMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );

      const emptyAvatarMember = buildJoinMember(UID_OUTSIDER, joinNow, {
        avatar: "",
      });
      await assertSucceeds(
        updateDoc(doc(outsiderDb, "teams/team_seed_join_avatar_empty"), {
          members: [...baseMembers, emptyAvatarMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-A07",
    "Suite A",
    "Outsider O CAN join ACTIVE team with avatar '' (empty string)",
    async () => {
      await seedTeam("team_seed_join_avatar_a07");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const newMember = buildJoinMember(UID_OUTSIDER, joinNow, { avatar: "" });
      await assertSucceeds(
        updateDoc(doc(outsiderDb, "teams/team_seed_join_avatar_a07"), {
          members: [...baseMembers, newMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  // ============================================================================
  // SUITE B: UNAUTH, NON-CAPTAIN MEMBER, CREATE, AND DELETE BOUNDARIES (DENY)
  // ============================================================================
  printSuiteHeader("Suite B: Unauth, Non-Captain Member, Create, and Delete Boundaries (DENY)");

  await recordTest(
    "TC-TM-B01",
    "Suite B",
    "Unauthenticated visitor CANNOT update a team",
    async () => {
      await seedTeam("team_deny_b01");
      await assertFails(
        updateDoc(doc(unauthDb, "teams/team_deny_b01"), {
          description: "Hacked description",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-TM-B02",
    "Suite B",
    "Member M1 CANNOT change captainId",
    async () => {
      await seedTeam("team_deny_b02");
      await assertFails(
        updateDoc(doc(member1Db, "teams/team_deny_b02"), {
          captainId: UID_MEMBER1,
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-TM-B03",
    "Suite B",
    "Member M1 CANNOT change ownerId",
    async () => {
      await seedTeam("team_deny_b03");
      await assertFails(
        updateDoc(doc(member1Db, "teams/team_deny_b03"), {
          ownerId: UID_MEMBER1,
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-TM-B04",
    "Suite B",
    "Member M1 CANNOT change inviteCode",
    async () => {
      await seedTeam("team_deny_b04");
      await assertFails(
        updateDoc(doc(member1Db, "teams/team_deny_b04"), {
          inviteCode: "HIJACK-0000",
          inviteUrl: "https://pitchly.ug/teams/join/HIJACK-0000",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-TM-B05",
    "Suite B",
    "Member M1 CANNOT change name",
    async () => {
      await seedTeam("team_deny_b05");
      await assertFails(
        updateDoc(doc(member1Db, "teams/team_deny_b05"), {
          name: "Stolen Squad Name",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-TM-B06",
    "Suite B",
    "Member M1 CANNOT change status",
    async () => {
      await seedTeam("team_deny_b06");
      await assertFails(
        updateDoc(doc(member1Db, "teams/team_deny_b06"), {
          status: "DISBANDED",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-TM-B07",
    "Suite B",
    "Member M1 CANNOT rewrite members (setting own isCaptain: true)",
    async () => {
      await seedTeam("team_deny_b07");
      const rewrittenMembers = buildBaseMembers(nowIso).map((m) =>
        m.userId === UID_MEMBER1 ? { ...m, isCaptain: true, role: "captain" } : m
      );
      await assertFails(
        updateDoc(doc(member1Db, "teams/team_deny_b07"), {
          members: rewrittenMembers,
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-TM-B08",
    "Suite B",
    "Member M1 CANNOT remove another uid (captain C) from memberIds",
    async () => {
      await seedTeam("team_deny_b08");
      await assertFails(
        updateDoc(doc(member1Db, "teams/team_deny_b08"), {
          memberIds: [UID_MEMBER1],
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-TM-B09",
    "Suite B",
    "Member M1 CANNOT delete team",
    async () => {
      await seedTeam("team_deny_b09");
      await assertFails(deleteDoc(doc(member1Db, "teams/team_deny_b09")));
    }
  );

  await recordTest(
    "TC-TM-B10",
    "Suite B",
    "Outsider O CANNOT delete team",
    async () => {
      await seedTeam("team_deny_b10");
      await assertFails(deleteDoc(doc(outsiderDb, "teams/team_deny_b10")));
    }
  );

  await recordTest(
    "TC-TM-B11",
    "Suite B",
    "User CANNOT create team with captainId != own uid",
    async () => {
      const spoofId = "team_spoof_captain";
      await assertFails(
        setDoc(doc(outsiderDb, `teams/${spoofId}`), buildSeedTeam(spoofId, nowIso, {
          captainId: UID_CAPTAIN,
          ownerId: UID_CAPTAIN,
        }))
      );
    }
  );

  // ============================================================================
  // SUITE C: OUTSIDER NON-JOIN EDITS & JOIN ABUSE (DENY)
  // ============================================================================
  printSuiteHeader("Suite C: Outsider Non-Join Edits & Join Privilege Escalation (DENY)");

  await recordTest(
    "TC-TM-C01",
    "Suite C",
    "Outsider O CANNOT update a non-join field (name)",
    async () => {
      await seedTeam("team_deny_c01");
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_c01"), {
          name: "Vandalized Squad",
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-TM-C02",
    "Suite C",
    "Outsider O CANNOT update a non-join field (captainId)",
    async () => {
      await seedTeam("team_deny_c02");
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_c02"), {
          captainId: UID_OUTSIDER,
          updatedAt: new Date().toISOString(),
        })
      );
    }
  );

  await recordTest(
    "TC-TM-C03",
    "Suite C",
    "Outsider O CANNOT join with isCaptain: true",
    async () => {
      await seedTeam("team_deny_c03");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const escalatedMember = buildJoinMember(UID_OUTSIDER, joinNow, { isCaptain: true });
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_c03"), {
          members: [...baseMembers, escalatedMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-C04",
    "Suite C",
    "Outsider O CANNOT join with role: 'admin'",
    async () => {
      await seedTeam("team_deny_c04");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const escalatedMember = buildJoinMember(UID_OUTSIDER, joinNow, { role: "admin" });
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_c04"), {
          members: [...baseMembers, escalatedMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-C05",
    "Suite C",
    "Outsider O CANNOT join with hasPaid: true",
    async () => {
      await seedTeam("team_deny_c05");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const escalatedMember = buildJoinMember(UID_OUTSIDER, joinNow, { hasPaid: true });
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_c05"), {
          members: [...baseMembers, escalatedMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-C06",
    "Suite C",
    "Outsider O CANNOT add a DIFFERENT uid to memberIds",
    async () => {
      await seedTeam("team_deny_c06");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const newMember = buildJoinMember(UID_OUTSIDER, joinNow);
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_c06"), {
          members: [...baseMembers, newMember],
          memberIds: arrayUnion(UID_OTHER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-C07",
    "Suite C",
    "Outsider O CANNOT add two members at once",
    async () => {
      await seedTeam("team_deny_c07");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const memberA = buildJoinMember(UID_OUTSIDER, joinNow);
      const memberB = buildJoinMember(UID_OTHER, joinNow);
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_c07"), {
          members: [...baseMembers, memberA, memberB],
          memberIds: [UID_CAPTAIN, UID_MEMBER1, UID_OUTSIDER, UID_OTHER],
          updatedAt: joinNow,
        })
      );
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_c07"), {
          members: [...baseMembers, memberA, memberB],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-C08",
    "Suite C",
    "Outsider O CANNOT join a team whose status != 'ACTIVE'",
    async () => {
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const newMember = buildJoinMember(UID_OUTSIDER, joinNow);
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_seed_disbanded"), {
          members: [...baseMembers, newMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  // ============================================================================
  // SUITE D: SQUAD CREATION INTEGRITY BOUNDARIES (DENY)
  // ============================================================================
  printSuiteHeader("Suite D: Squad Creation Integrity Boundaries (DENY)");

  await recordTest(
    "TC-TM-D01",
    "Suite D",
    "Captain C CANNOT create team with memberIds containing another uid",
    async () => {
      const teamId = "team_deny_d01";
      await assertFails(
        setDoc(
          doc(captainDb, `teams/${teamId}`),
          buildCreateTeamPayload(teamId, UID_CAPTAIN, nowIso, {
            memberIds: [UID_CAPTAIN, UID_OUTSIDER],
          })
        )
      );
    }
  );

  await recordTest(
    "TC-TM-D02",
    "Suite D",
    "Captain C CANNOT create team with members.size() > 1",
    async () => {
      const teamId = "team_deny_d02";
      const extraMember = buildJoinMember(UID_OUTSIDER, nowIso);
      const basePayload = buildCreateTeamPayload(teamId, UID_CAPTAIN, nowIso);
      await assertFails(
        setDoc(doc(captainDb, `teams/${teamId}`), {
          ...basePayload,
          members: [...basePayload.members, extraMember],
        })
      );
    }
  );

  await recordTest(
    "TC-TM-D03",
    "Suite D",
    "Captain C CANNOT create team where members[0].userId != captain uid",
    async () => {
      const teamId = "team_deny_d03";
      const basePayload = buildCreateTeamPayload(teamId, UID_CAPTAIN, nowIso);
      await assertFails(
        setDoc(doc(captainDb, `teams/${teamId}`), {
          ...basePayload,
          members: [{ ...basePayload.members[0], userId: UID_OUTSIDER }],
        })
      );
    }
  );

  await recordTest(
    "TC-TM-D04",
    "Suite D",
    "Captain C CANNOT create team with status != 'ACTIVE'",
    async () => {
      const teamId = "team_deny_d04";
      await assertFails(
        setDoc(
          doc(captainDb, `teams/${teamId}`),
          buildCreateTeamPayload(teamId, UID_CAPTAIN, nowIso, {
            status: "DISBANDED",
          })
        )
      );
    }
  );

  await recordTest(
    "TC-TM-D05",
    "Suite D",
    "Captain C CANNOT create team with ownerId != captainId",
    async () => {
      const teamId = "team_deny_d05";
      await assertFails(
        setDoc(
          doc(captainDb, `teams/${teamId}`),
          buildCreateTeamPayload(teamId, UID_CAPTAIN, nowIso, {
            ownerId: UID_OUTSIDER,
          })
        )
      );
    }
  );

  // ============================================================================
  // SUITE E: JOIN MEMBER ENTRY SHAPE & FIELD VALIDATION BOUNDARIES (DENY)
  // ============================================================================
  printSuiteHeader("Suite E: Join Member Entry Shape & Field Validation Boundaries (DENY)");

  await recordTest(
    "TC-TM-E01",
    "Suite E",
    "Outsider O CANNOT join with an extra unknown field in the new member entry",
    async () => {
      await seedTeam("team_deny_e01");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const badMember = buildJoinMember(UID_OUTSIDER, joinNow, { spoofedAdmin: true });
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_e01"), {
          members: [...baseMembers, badMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-E02",
    "Suite E",
    "Outsider O CANNOT join with paymentStatus != 'pending'",
    async () => {
      await seedTeam("team_deny_e02");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const badMember = buildJoinMember(UID_OUTSIDER, joinNow, { paymentStatus: "paid" });
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_e02"), {
          members: [...baseMembers, badMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-E03",
    "Suite E",
    "Outsider O CANNOT join with status != 'active'",
    async () => {
      await seedTeam("team_deny_e03");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const badMember = buildJoinMember(UID_OUTSIDER, joinNow, { status: "suspended" });
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_e03"), {
          members: [...baseMembers, badMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-E04",
    "Suite E",
    "Outsider O CANNOT join with id != 'm_' + uid",
    async () => {
      await seedTeam("team_deny_e04");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const badMember = buildJoinMember(UID_OUTSIDER, joinNow, { id: "m_forged_member" });
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_e04"), {
          members: [...baseMembers, badMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-E05",
    "Suite E",
    "Outsider O CANNOT join with name not a string",
    async () => {
      await seedTeam("team_deny_e05");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const badMember = buildJoinMember(UID_OUTSIDER, joinNow, { name: 12345 as any });
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_e05"), {
          members: [...baseMembers, badMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-E06",
    "Suite E",
    "Outsider O CANNOT join with name longer than 100 chars",
    async () => {
      await seedTeam("team_deny_e06");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const badMember = buildJoinMember(UID_OUTSIDER, joinNow, { name: "A".repeat(101) });
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_e06"), {
          members: [...baseMembers, badMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-E07",
    "Suite E",
    "Outsider O CANNOT join with contact longer than 40 chars",
    async () => {
      await seedTeam("team_deny_e07");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const badMember = buildJoinMember(UID_OUTSIDER, joinNow, { contact: "9".repeat(41) });
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_e07"), {
          members: [...baseMembers, badMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-E08",
    "Suite E",
    "Outsider O CANNOT join with avatar not a string",
    async () => {
      await seedTeam("team_deny_e08");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const badMember = buildJoinMember(UID_OUTSIDER, joinNow, { avatar: 999 as any });
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_e08"), {
          members: [...baseMembers, badMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-E09",
    "Suite E",
    "Outsider O CANNOT join with a data:image/jpeg;base64,... avatar",
    async () => {
      await seedTeam("team_deny_e09");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const badMember = buildJoinMember(UID_OUTSIDER, joinNow, {
        avatar: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/",
      });
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_e09"), {
          members: [...baseMembers, badMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  await recordTest(
    "TC-TM-E10",
    "Suite E",
    "Outsider O CANNOT join with an avatar longer than 1000 chars",
    async () => {
      await seedTeam("team_deny_e10");
      const joinNow = new Date().toISOString();
      const baseMembers = buildBaseMembers(nowIso);
      const badMember = buildJoinMember(UID_OUTSIDER, joinNow, {
        avatar: `https://example.com/avatar/${"a".repeat(980)}`,
      });
      await assertFails(
        updateDoc(doc(outsiderDb, "teams/team_deny_e10"), {
          members: [...baseMembers, badMember],
          memberIds: arrayUnion(UID_OUTSIDER),
          updatedAt: joinNow,
        })
      );
    }
  );

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}TEAMS SECURITY RULES TEST SUMMARY${RESET}`);
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
      `\n${GREEN}${BOLD}ALL ${total} / ${total} TEAMS SECURITY TEST CASES PASSED IN EMULATOR! 🛡️${RESET}\n`
    );
    process.exit(0);
  }
}

runTestSuite().catch((e) => {
  console.error("Test execution runner crashed:", e);
  process.exit(1);
});
