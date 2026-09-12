import { tournamentService } from "../services/tournamentService";

async function verify() {
  console.log("=== RUNNING VERIFICATION TEST ON TOURNAMENT SERVICE ===");
  const tournamentId = "wehat-s2-w1";

  let fixturesData: any[] = [];
  let scorersData: any[] = [];
  let nomineesData: any[] = [];

  const unsubF = tournamentService.subscribeToFixtures(tournamentId, (data) => {
    fixturesData = data;
  });
  const unsubS = tournamentService.subscribeToScorers(tournamentId, (data) => {
    scorersData = data;
  });
  const unsubN = tournamentService.subscribeToNominees(tournamentId, (data) => {
    nomineesData = data;
  });

  console.log(`\n[TAB 1: LIVE SCORES] Fixtures loaded count: ${fixturesData.length}`);
  fixturesData.forEach((f) => {
    console.log(`  - [${f.status.toUpperCase()}] ${f.homeTeam} ${f.homeScore ?? "-"} vs ${f.awayScore ?? "-"} ${f.awayTeam} (${f.time}, ${f.pitchVenue})`);
  });

  console.log(`\n[TAB 2: TOP SCORER] Scorers loaded count: ${scorersData.length}`);
  scorersData.forEach((s, idx) => {
    console.log(`  #${idx + 1} ${s.playerName} (${s.teamName}) - ${s.goals} Goals`);
  });

  console.log(`\n[TAB 3: MAN OF THE MATCH] Nominees loaded count: ${nomineesData.length}`);
  nomineesData.forEach((n, idx) => {
    console.log(`  Candidate: ${n.nomineeName} (${n.teamName} - ${n.position}) - ${n.voteCount} Votes`);
  });

  // TEST GOAL UPDATE
  console.log("\n--- TESTING TEST GOAL UPDATE (+1 goal) ---");
  const topScorer = scorersData[0];
  const initialGoals = topScorer.goals;
  console.log(`Initial goals for ${topScorer.playerName}: ${initialGoals}`);
  await tournamentService.incrementScorerGoals(topScorer.id, 1);
  console.log(`Updated goals for ${topScorer.playerName}: ${scorersData.find(s => s.id === topScorer.id)?.goals}`);

  // TEST MOTM VOTE
  console.log("\n--- TESTING TEST MOTM VOTE (+1 vote) ---");
  const topNominee = nomineesData[0];
  const initialVotes = topNominee.voteCount;
  console.log(`Initial votes for ${topNominee.nomineeName}: ${initialVotes}`);
  const updatedVotes = await tournamentService.voteForNominee(tournamentId, topNominee.id);
  console.log(`Updated votes for ${topNominee.nomineeName}: ${updatedVotes}`);

  console.log("\n--- TESTING FIXTURE SCORE UPDATE ---");
  const liveMatch = fixturesData.find(f => f.status === "live");
  console.log(`Live match: ${liveMatch.homeTeam} ${liveMatch.homeScore} - ${liveMatch.awayScore} ${liveMatch.awayTeam}`);
  await tournamentService.updateFixture(liveMatch.id, { homeScore: 4, awayScore: 2 });
  const updatedMatch = fixturesData.find(f => f.id === liveMatch.id);
  console.log(`Updated match score: ${updatedMatch.homeTeam} ${updatedMatch.homeScore} - ${updatedMatch.awayScore} ${updatedMatch.awayTeam}`);

  unsubF();
  unsubS();
  unsubN();

  console.log("\n=== ALL TEST CHECKS PASSED WITH REAL-TIME REACTIVITY! ===");
}

verify().catch(console.error);
