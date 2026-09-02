export enum BookingStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAYMENT_SUBMITTED = 'PAYMENT_SUBMITTED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  CHECKED_IN = 'CHECKED_IN',
  NO_SHOW = 'NO_SHOW',
  PENDING = 'PENDING'
}

export enum PaymentMethod {
  CASH = 'CASH',
  MTN = 'MTN',
  AIRTEL = 'AIRTEL',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CARD = 'CARD'
}

export enum PitchStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  CLOSED = 'CLOSED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  PENDING_INSPECTION = 'PENDING_INSPECTION',
  REJECTED = 'REJECTED'
}

export interface Turf {
  id: string;
  ownerId?: string;
  name: string;
  location: string;
  coordinates?: [number, number];
  rating: number;
  pricePerHour: number;
  image: string;
  amenities: string[];
  distance: string;
  openingHour: string;
  closingHour: string;
  blockedDates: string[];
  isVerified?: boolean;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  status: PitchStatus;
  staff?: StaffMember[];
  caretakerIds?: string[];
  submittedAt?: string;
  approvalStage?: 'PENDING_APPROVAL' | 'PENDING_INSPECTION' | 'ACTIVE' | 'REJECTED' | 'MAINTENANCE';
  rejectionReason?: string;
  inspectedAt?: string;
  inspectedBy?: string;
  certificationNumber?: string;
  pitchFormats?: string[];
  fullAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  additionalImages?: string[];
  description?: string;
  type?: string;
  images?: string[];
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

export interface PitchSubmission extends Turf {}

export interface StaffMember {
  id: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'CARETAKER';
  phone: string;
  avatar?: string;
  assignedTurfs?: string[];
  status?: 'ACTIVE' | 'PENDING' | 'REVOKED';
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  time: string;
  status: 'LIVE' | 'UPCOMING' | 'FT';
  league: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  wins: number;
  losses: number;
  members: number;
  nextMatch?: string;
}

export interface Review {
  id: string;
  turfId: string;
  bookingId: string;
  playerId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  turfId?: string;
  pitchId?: string;
  turfName?: string;
  pitchName?: string;
  // FIX: Renamed from 'userId' to 'playerId'
  // This matches Firestore security rules and BookingContext
  playerId: string;
  userName?: string;
  ownerId: string;
  date: string;
  time: string;
  slots: string[];
  duration: number;
  status: BookingStatus;
  price?: number;
  totalPrice?: number;
  qrCode?: string;
  qrToken?: string;
  createdAt: string;
  updatedAt?: string;
  checkedInBy?: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' | 'APPROVED' | 'REJECTED' | 'SUBMITTED' | 'DISPUTED';
  paymentMethod?: PaymentMethod;
  paymentProofUrl?: string;
  paymentSubmittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  hasReviewed?: boolean;
  cancelledAt?: string;
  holdExpiresAt?: string;
  userId?: string;
  playerPhone?: string;
  playerEmail?: string;
  numberOfPlayers?: number;
}

export interface UserProfile {
  name: string;
  role: 'PLAYER' | 'OWNER' | 'STAFF';
  xp: number;
  level: number;
  badges: string[];
}

export interface Payout {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  requestDate: string;
  processedDate?: string;
  method: 'MOBILE_MONEY' | 'BANK_TRANSFER';
}

export interface Transaction {
  id: string;
  bookingId?: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  date: string;
}

export interface BusinessProfile {
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  mobileMoneyNumber: string;
  bankDetails?: string;
  operatingHours: { open: string; close: string };
  paymentDetails?: {
    mtnNumber: string;
    mtnAccountName: string;
    airtelNumber: string;
    airtelAccountName: string;
    acceptsCash: boolean;
  };
}

export enum ReportStatus {
  OPEN = 'open',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export enum ReportTargetType {
  PITCH = 'pitch',
  USER = 'user',
  BOOKING = 'booking'
}

export interface Report {
  id: string;
  reporterId: string;
  reporterRole: 'player' | 'owner';
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  isDemoData?: boolean;
}
