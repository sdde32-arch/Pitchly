import { Conversation } from '../../types/firebase';

export interface OtherParticipantInfo {
  name: string;
  avatar: string;
  role: string;
}

export function getOtherParticipant(
  conv: Conversation,
  myUid?: string | null,
  viewerSide: 'player' | 'owner' = 'player'
): OtherParticipantInfo {
  const fallbackName = viewerSide === 'owner' ? 'Player' : 'Pitch manager';
  const participants = Array.isArray(conv.participants) ? conv.participants : [];
  const otherUid = participants.find((uid) => Boolean(uid) && uid !== myUid);
  const details = otherUid ? conv.participantDetails?.[otherUid] : undefined;

  const trimmedDetailsName = typeof details?.name === 'string' ? details.name.trim() : '';
  const trimmedConvName = typeof conv.name === 'string' ? conv.name.trim() : '';
  const rawAvatar = typeof details?.avatar === 'string' ? details.avatar.trim() : '';
  const trimmedAvatar = rawAvatar.toLowerCase().includes('ui-avatars.com') ? '' : rawAvatar;
  const trimmedRole = typeof details?.role === 'string' ? details.role.trim() : '';

  const name =
    conv.type === 'TEAM' && trimmedConvName
      ? trimmedConvName
      : trimmedDetailsName || trimmedConvName || fallbackName;

  return {
    name,
    avatar: trimmedAvatar,
    role: trimmedRole || fallbackName,
  };
}

export function getChatTitle(
  conv: Conversation,
  myUid?: string | null,
  viewerSide: 'player' | 'owner' = 'player'
): string {
  return getOtherParticipant(conv, myUid, viewerSide).name;
}

export function getChatSubtitle(conv: Conversation): string {
  const turfName = typeof conv.turfName === 'string' ? conv.turfName.trim() : '';
  return turfName ? `About ${turfName}` : '';
}

export function formatConversationTime(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getMessageDayKey(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDaySeparator(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const msgStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((todayStart - msgStart) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
