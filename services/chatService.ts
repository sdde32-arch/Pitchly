import { db } from '../lib/firebase';
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
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { Conversation, Message } from '../types/firebase';

export const chatService = {
  // Create or get a direct conversation between two users
  async getOrCreateDirectConversation(userId1: string, userId2: string): Promise<string> {
    const conversationsRef = collection(db, 'conversations');
    const q1 = query(
      conversationsRef, 
      where('participants', 'array-contains', userId1),
      where('type', '==', 'DIRECT')
    );
    
    const snapshot = await getDocs(q1);
    const existing = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(userId2);
    });

    if (existing) {
      return existing.id;
    }

    // Create new
    const newConvRef = doc(collection(db, 'conversations'));
    const now = new Date().toISOString();
    
    const newConv: Conversation = {
      id: newConvRef.id,
      participants: [userId1, userId2],
      type: 'DIRECT',
      createdAt: now,
      updatedAt: now,
    };
    
    await setDoc(newConvRef, newConv);
    return newConv.id;
  },

  // Create a team chat
  async createTeamConversation(teamId: string, teamName: string, participantIds: string[]): Promise<string> {
    const convRef = doc(db, 'conversations', teamId);
    
    const docSnap = await getDoc(convRef);
    if (docSnap.exists()) {
      // Just update participants if needed, but for now just return it
      return convRef.id;
    }

    const now = new Date().toISOString();
    const newConv: Conversation = {
      id: convRef.id,
      participants: participantIds,
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
    await updateDoc(convRef, {
      participants: participantIds,
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
    
    const msgRef = doc(msgsRef);
    const newMessage: Message = {
      id: msgRef.id,
      conversationId,
      senderId,
      senderName,
      senderAvatar,
      text,
      createdAt: now,
    };
    
    await setDoc(msgRef, newMessage);

    // Update conversation lastMessage
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      lastMessage: text,
      lastMessageAt: now,
      updatedAt: now,
    });
    
    return msgRef.id;
  }
};
