import { auth, db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  arrayUnion,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { Conversation, Message } from '../types/firebase';

function sanitizeAvatar(v: unknown): string {
  return typeof v === 'string' && v.startsWith('https://') && v.length <= 1000 ? v : '';
}

function sanitizeParticipantDetails(
  details?: { [uid: string]: { name?: string; avatar?: string; role?: string } }
): { [uid: string]: { name?: string; avatar?: string; role?: string } } | undefined {
  if (!details) return undefined;
  const sanitized: { [uid: string]: { name?: string; avatar?: string; role?: string } } = {};
  for (const [uid, info] of Object.entries(details)) {
    if (!info) continue;
    sanitized[uid] = {
      ...info,
      ...(info.avatar !== undefined ? { avatar: sanitizeAvatar(info.avatar) } : {}),
    };
  }
  return sanitized;
}

export const chatService = {
  // Create or get a direct conversation between two users
  async getOrCreateDirectConversation(
    userId1: string, 
    userId2: string, 
    extraMeta?: { 
      turfName?: string; 
      pitchId?: string; 
      participantDetails?: { [uid: string]: { name?: string; avatar?: string; role?: string } } 
    }
  ): Promise<string> {
    const conversationsRef = collection(db, 'conversations');
    const q1 = query(
      conversationsRef, 
      where('participants', 'array-contains', userId1),
      where('type', '==', 'DIRECT')
    );
    
    const snapshot = await getDocs(q1);
    const existing = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants && data.participants.includes(userId2);
    });

    if (existing) {
      if (extraMeta) {
        try {
          const cleanParticipantDetails = sanitizeParticipantDetails(extraMeta.participantDetails);
          await updateDoc(doc(db, 'conversations', existing.id), {
            ...(extraMeta.turfName ? { turfName: extraMeta.turfName } : {}),
            ...(extraMeta.pitchId ? { pitchId: extraMeta.pitchId } : {}),
            ...(cleanParticipantDetails ? { participantDetails: cleanParticipantDetails } : {}),
            updatedAt: new Date().toISOString()
          });
        } catch (e) {
          console.warn("Could not update conversation extra metadata:", e);
        }
      }
      return existing.id;
    }

    // Create new
    const newConvRef = doc(collection(db, 'conversations'));
    const now = new Date().toISOString();
    const cleanParticipantDetails = sanitizeParticipantDetails(extraMeta?.participantDetails);
    
    const newConv: Conversation = {
      id: newConvRef.id,
      participants: [userId1, userId2],
      type: 'DIRECT',
      ...(extraMeta?.turfName ? { turfName: extraMeta.turfName } : {}),
      ...(extraMeta?.pitchId ? { pitchId: extraMeta.pitchId } : {}),
      ...(cleanParticipantDetails ? { participantDetails: cleanParticipantDetails } : {}),
      createdAt: now,
      updatedAt: now,
    };
    
    await setDoc(newConvRef, newConv);
    return newConv.id;
  },

  // Create a team chat
  async createTeamConversation(teamId: string, teamName: string, participantIds: string[]): Promise<string> {
    const convRef = doc(db, 'conversations', teamId);
    const currentUid = auth.currentUser?.uid;
    const uniqueParticipants = Array.from(
      new Set([...participantIds, ...(currentUid ? [currentUid] : [])].filter(Boolean))
    );
    
    const docSnap = await getDoc(convRef);
    if (docSnap.exists()) {
      const existingParticipants: string[] = Array.isArray(docSnap.data()?.participants)
        ? docSnap.data()!.participants
        : [];
      if (currentUid && !existingParticipants.includes(currentUid)) {
        await updateDoc(convRef, {
          participants: arrayUnion(currentUid),
          updatedAt: new Date().toISOString(),
        });
      } else if (currentUid && existingParticipants.includes(currentUid)) {
        const missingIds = uniqueParticipants.filter((id) => !existingParticipants.includes(id));
        if (missingIds.length > 0) {
          await updateDoc(convRef, {
            participants: arrayUnion(...missingIds),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      return convRef.id;
    }

    const now = new Date().toISOString();
    const newConv: Conversation = {
      id: convRef.id,
      participants: uniqueParticipants,
      type: 'TEAM',
      name: teamName + ' Chat',
      createdAt: now,
      updatedAt: now,
    };
    
    await setDoc(convRef, newConv);
    return convRef.id;
  },

  // Update team chat participants
  async updateTeamChatParticipants(teamId: string, participantIds: string[]): Promise<void> {
    const convRef = doc(db, 'conversations', teamId);
    const uniqueParticipants = Array.from(new Set(participantIds.filter(Boolean)));
    await updateDoc(convRef, {
      participants: uniqueParticipants,
      updatedAt: new Date().toISOString()
    });
  },

  // Subscribe to user's conversations
  subscribeToUserConversations(userId: string, callback: (convs: Conversation[]) => void) {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => doc.data() as Conversation);
      callback(convs);
    });
  },

  // Subscribe to messages in a conversation
  subscribeToMessages(conversationId: string, callback: (msgs: Message[]) => void) {
    const q = query(
      collection(db, `conversations/${conversationId}/messages`),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data() as Message);
      callback(msgs);
    });
  },

  // Send a message
  async sendMessage(conversationId: string, senderId: string, text: string, senderName?: string, senderAvatar?: string) {
    const msgsRef = collection(db, `conversations/${conversationId}/messages`);
    const now = new Date().toISOString();
    const cleanText = text.trim().slice(0, 2000);
    const cleanAvatar = sanitizeAvatar(senderAvatar);
    
    const msgRef = doc(msgsRef);
    const newMessage: Message = {
      id: msgRef.id,
      conversationId,
      senderId,
      senderName,
      senderAvatar: cleanAvatar,
      text: cleanText,
      createdAt: now,
    };
    
    await setDoc(msgRef, newMessage);

    // Update conversation lastMessage
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      lastMessage: cleanText,
      lastMessageAt: now,
      lastMessageSenderName: senderName || '',
      lastMessageSenderAvatar: cleanAvatar,
      updatedAt: now,
    });
    
    return msgRef.id;
  }
};
