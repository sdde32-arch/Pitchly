export type FixtureStatus = "upcoming" | "live" | "finished";

export interface TournamentFixture {
  id: string;
  tournamentId: string;
  time: string; // e.g. "2:30 PM"
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: FixtureStatus;
  pitchVenue?: string; // e.g. "Tal Olympic, Bayern Munyonyo"
  round?: string; // e.g. "Group Stage - Match 1"
  createdAt?: string;
  updatedAt?: string;
}

export interface TournamentScorer {
  id: string;
  tournamentId: string;
  playerName: string;
  teamName: string;
  goals: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TournamentNominee {
  id: string;
  tournamentId: string;
  nomineeName: string;
  teamName: string;
  photoUrl?: string; // optional
  voteCount: number;
  position?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TournamentInfo {
  id: string;
  name: string;
  season: string;
  week: string;
  date: string;
  venue: string;
  description?: string;
}

export const DEFAULT_TOURNAMENT: TournamentInfo = {
  id: "wehat-s2-w1",
  name: "WEHAT Soccer Tournament",
  season: "Season 2",
  week: "Week 1",
  date: "12 Sept 2026",
  venue: "Tal Olympic, Bayern Munyonyo",
  description: "Official real-time tournament hub with live scores, golden boot standings, and Man of the Match fan voting.",
};
