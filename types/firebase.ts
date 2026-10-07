// Firebase Data Architecture & Interfaces
import { BookingStatus, PaymentMethod, PitchStatus } from "../types";

/**
 * Expected Security Rules Access:
 * - Players can only read public fields or their own private fields.
 * - Players can update their own user profile.
 *
 * Developer Note on Admin Assignment:
 * - First admin should be assigned manually in Firestore (e.g. by setting role: 'admin') or through Firebase Admin SDK.
 * - Do not allow users to self-select the admin role in the frontend.
 */
export interface User {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  phone?: string;
  role: 'PLAYER' | 'OWNER' | 'ADMIN' | 'CARETAKER';
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'BANNED' | 'UNVERIFIED';
}

/**
 * Pitch (Turf) Data Model
 * Expected Security Rules:
 * - Public to read (if status is ACTIVE).
 * - Owners can read all their own pitches, and update them.
 * - Admins can read all, update all.
 */
export interface Pitch {
  id: string;
  ownerId: string;
  name: string;
  location: string;
  fullAddress?: string;
  coordinates?: [number, number];
  pricePerHour: number;
  pitchFormats: string[]; // e.g. ["5-a-side", "7-a-side"]
  amenities: string[];
  images: string[];
  additionalImages?: string[];
  openingHour: string;
  closingHour: string;
  isVerified: boolean;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  status: PitchStatus;
  createdAt: string;
  updatedAt: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
  surfaceType?: string;
  dimensions?: string;
  numberOfPitches?: number;
  peakPricePerHour?: number;
  depositPercentage?: number;
  paymentPhone?: string;
  paymentAccountName?: string;
  acceptedPaymentMethods?: string[];
  rules?: string[];
  footwearPolicy?: string;
  cancellationPolicy?: string;
  landmark?: string;
}

/**
 * Booking Data Model
 * Expected Security Rules:
 * - Players can only read their own bookings.
 * - Players can create bookings for themselves.
 * - Owners can read/update bookings for their turfs.
 */
export interface Booking {
  id: string;
  pitchId: string;
  turfId?: string;
  turfName?: string;
  userName?: string;
  playerId: string;
  ownerId: string;
  date: string;
  time: string; // e.g. "19:00"
  timeSlot?: string;
  duration: number; // in hours
  slots: string[];
  totalPrice: number;
  price?: number;
  qrToken?: string;
  status: BookingStatus;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' | 'APPROVED' | 'REJECTED' | 'SUBMITTED' | 'DISPUTED';
  paymentMethod?: PaymentMethod;
  paymentProofUrl?: string;
  paymentSubmittedAt?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  holdExpiresAt?: string;
  userId?: string;
  pitchName?: string;
  playerPhone?: string;
  playerEmail?: string;
  numberOfPlayers?: number;
  image?: string;
  location?: string;
  bookingRef?: string;
  pitchFormat?: string;
  managerName?: string;
  contactPhone?: string;
}

/**
 * Lightweight Slot Availability Data Model (Public mirror)
 * Contains ONLY pitchId, date, time, status, expiresAt, updatedAt
 * No sensitive player, contact, or payment information.
 */
export interface SlotAvailability {
  id: string; // `${pitchId}_${date}_${time}`
  pitchId: string;
  date: string;
  time: string; // e.g. "19:00"
  status: 'held' | 'booked' | 'open' | 'blocked';
  expiresAt?: string;
  updatedAt?: string;
}

/**
 * Team Member Data Model
 */
export interface TeamMember {
  id: string;
  userId?: string;
  name: string;
  contact?: string;
  role?: 'captain' | 'vice_captain' | 'player';
  isCaptain: boolean;
  hasPaid?: boolean;
  avatar?: string;
  joinedAt?: string;
  status?: 'active' | 'pending';
  paymentStatus?: 'paid' | 'pending' | 'waived';
}

/**
 * Team Data Model
 * Expected Security Rules:
 * - Public to read active teams.
 * - Members can read internal group details.
 * - Captain (owner) can update the team.
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  type: string; // e.g. "5-a-side"
  location?: string;
  logo?: string;
  captainId: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'DISBANDED';
  inviteCode?: string; // Unique invite code for direct joining
  inviteUrl?: string; // Precomputed full invite link
  members?: TeamMember[];
  maxMembers?: number;
}

/**
 * Match Data Model
 * Expected Security Rules:
 * - Public to read if visibility is 'Public'.
 * - Private matches only readable by joined players / invitees.
 * - Captain can update or delete.
 */
export interface MatchScorer {
  playerId: string;
  playerName: string;
  goals: number;
  team: 'teamA' | 'teamB';
  minute?: string;
}

export interface MatchResult {
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  winner: 'teamA' | 'teamB' | 'draw';
  scorers: MatchScorer[];
  mvpPlayerId?: string;
  mvpPlayerName?: string;
  recordedBy?: string;
  recordedAt: string;
  notes?: string;
}

export interface Match {
  id: string;
  title: string;
  pitchId: string;
  pitchName: string; // Cached for fast UI
  date: string;
  time: string;
  type: string;
  playersNeeded: number;
  captainId: string; // The user who created the match
  visibility: 'Public' | 'Private';
  status: 'Open' | 'Full' | 'Completed' | 'Cancelled';
  notes?: string;
  totalCost: number;
  costPerPlayer: number;
  collectedAmount: number;
  result?: MatchResult;
  createdAt: string;
  updatedAt: string;
}

/**
 * MatchPlayer Data Model (Subcollection or associative collection)
 * Expected Security Rules:
 * - Readable by players in the same match.
 * - Updateable by the match captain (e.g. paymentStatus).
 */
export interface MatchPlayer {
  id: string;
  matchId: string;
  userId: string;
  name: string; // Cached for fast UI
  avatar?: string; // Cached
  isCaptain: boolean;
  paymentStatus: 'paid' | 'pending' | 'waived';
  status: 'joined' | 'invited' | 'declined';
  joinedAt: string;
  updatedAt: string;
}

/**
 * Payment Data Model
 * Expected Security Rules:
 * - Only readable by the payer, the payee, or Admins.
 * - Created by secure backend functions or verified webhooks.
 */
export interface Payment {
  id: string;
  bookingId?: string;
  matchId?: string;
  payerId: string;
  payeeId: string; // Custom owner ID or pitchly platform ID
  amount: number;
  currency: string;
  method: 'MOBILE_MONEY' | 'CARD' | 'CASH';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  reference: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transaction Data Model (For financial ledgers)
 * Expected Security Rules:
 * - Owners can only read transactions linked to them.
 * - Immutable collection (No updates/deletes allowed).
 */
export interface Transaction {
  id: string;
  ownerId: string;
  bookingId?: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * OwnerProfile Data Model
 * Expected Security Rules:
 * - Public info.
 * - Owner can update their own details.
 * - Admins can read/update all.
 */
export interface OwnerProfile {
  id: string; // Same as userId
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  mobileMoneyNumber: string;
  bankDetails?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Review Data Model
 * Expected Security Rules:
 * - Public to read.
 * - Players can only create a review for a completed booking they own.
 * - Players can only update/delete their own review.
 */
export interface Review {
  id: string;
  pitchId: string;
  bookingId: string;
  playerId: string;
  playerName: string; // Cached
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  verifiedBooking?: boolean;
}

/**
 * Notification Data Model
 * Expected Security Rules:
 * - Users can only read their own notifications.
 * - Users can update read status.
 */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'BOOKING_REMINDER' | 'MATCH_INVITE' | 'PAYMENT_RECEIVED' | 'SYSTEM';
  isRead: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * AdminReview Data Model (For pitch approval)
 * Expected Security Rules:
 * - Only Admins can read or write.
 */
export interface AdminReview {
  id: string;
  pitchId: string;
  adminId: string;
  status: 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Chat/Messaging Data Models
 */
export interface Conversation {
  id: string;
  participants: string[];
  type: 'DIRECT' | 'TEAM' | 'GROUP';
  name?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  text: string;
  createdAt: string;
}

/**
 * Match Invitation Data Model (Proposed games before a slot is booked)
 */
export type MatchInvitationCreatorRole = 'player' | 'owner' | 'staff';
export type MatchInvitationResponseStatus = 'accepted' | 'declined' | 'pending';
export type MatchInvitationStatus = 'proposing' | 'all_confirmed' | 'booked' | 'slot_taken' | 'expired' | 'cancelled';

export interface MatchInvitation {
  id?: string;
  creatorId: string;
  creatorName?: string;
  creatorAvatar?: string;
  creatorPhone?: string;
  creatorRole: MatchInvitationCreatorRole;
  pitchId: string;
  pitchName?: string;
  pitchLocation?: string;
  pitchImage?: string;
  pricePerHour?: number;
  proposedDateTime: string; // ISO string or timestamp
  date: string; // YYYY-MM-DD
  time: string; // e.g. "07:00 PM"
  playersNeeded: number;
  invitedUserIds: string[]; // specific invited user UIDs
  broadcastToPreviousBookers: boolean;
  responses: Record<string, MatchInvitationResponseStatus>; // map of userId -> status
  status: MatchInvitationStatus;
  createdAt: string;
  expiresAt: string; // 24 hours before proposed date/time
  bookingId?: string; // Linked booking document id once confirmed & booked
  notes?: string;
}

/**
 * Community Activity Feed Data Models
 */
export type CommunityActivityType =
  | 'match_played'
  | 'match_result'
  | 'team_formed'
  | 'team_update'
  | 'turf_booking'
  | 'tournament_completed';

export interface CommunityActivity {
  id: string;
  type: CommunityActivityType;
  title: string;
  subtitle: string;
  description?: string;
  timestamp: string; // ISO string
  userName?: string;
  userAvatar?: string;
  userBadge?: string;
  venue?: string;
  // Match specific details
  matchData?: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    scorers?: string[];
    mvp?: string;
    pitchName?: string;
    format?: string;
    status?: 'LIVE' | 'FT' | 'RECENT';
    liveMinute?: string;
  };
  // Team formed & team updates specific details
  teamData?: {
    teamName: string;
    captain: string;
    membersCount: number;
    homePitch?: string;
    badgeColor?: string;
    badgeInitials?: string;
    motto?: string;
    updateType?: 'recruitment' | 'formation' | 'roster_milestone' | 'challenge_issued';
    openPositions?: string[];
  };
  // Upcoming turf bookings specific details
  bookingData?: {
    pitchId?: string;
    pitchName: string;
    date: string; // YYYY-MM-DD or formatted date
    time: string; // e.g. "19:00 - 20:00"
    format?: string;
    bookedBy?: string;
    openSpotsCount?: number;
    pricePerHour?: number;
    isCommunityOpen?: boolean;
    location?: string;
    bookingStatus?: 'upcoming' | 'ongoing' | 'confirmed';
  };
  // Tournament completed specific details
  tournamentData?: {
    tournamentName: string;
    champion: string;
    runnerUp: string;
    participantsCount: number;
    goldenBootWinner?: string;
    goldenBootGoals?: number;
    season?: string;
    prizePool?: string;
    tournamentId?: string;
  };
  likesCount: number;
  celebrationsCount: number;
  likedBy?: string[];
  celebratedBy?: string[];
}

