import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  updateDoc 
} from 'firebase/firestore';

export interface SlotSubscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  pitchId: string;
  pitchName: string;
  date: string;
  time: string;
  createdAt: string;
  status: 'pending' | 'triggered';
}

export interface SlotNotification {
  id: string;
  userId: string;
  pitchId: string;
  pitchName: string;
  date: string;
  time: string;
  triggeredAt: string;
  read: boolean;
}

export const slotAlertService = {
  // Subscribe a user to a slot
  async subscribe(
    userId: string,
    userEmail: string,
    userName: string,
    pitchId: string,
    pitchName: string,
    date: string,
    time: string
  ): Promise<void> {
    try {
      const subId = `${userId}_${pitchId}_${date}_${time}`.replace(/[\/\s—:]/g, '-');
      const subRef = doc(db, 'slotAlertSubscriptions', subId);
      
      await setDoc(subRef, {
        id: subId,
        userId,
        userEmail,
        userName,
        pitchId,
        pitchName,
        date,
        time,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'slotAlertSubscriptions');
    }
  },

  // Unsubscribe a user from a slot
  async unsubscribe(userId: string, pitchId: string, date: string, time: string): Promise<void> {
    try {
      const subId = `${userId}_${pitchId}_${date}_${time}`.replace(/[\/\s—:]/g, '-');
      const subRef = doc(db, 'slotAlertSubscriptions', subId);
      await deleteDoc(subRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'slotAlertSubscriptions');
    }
  },

  // Check if a user is subscribed to a slot
  async isSubscribed(userId: string, pitchId: string, date: string, time: string): Promise<boolean> {
    try {
      const subId = `${userId}_${pitchId}_${date}_${time}`.replace(/[\/\s—:]/g, '-');
      const subRef = doc(db, 'slotAlertSubscriptions', subId);
      const snap = await getDoc(subRef);
      return snap.exists();
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'slotAlertSubscriptions');
    }
  },

  // List all active subscriptions for a user
  async listByUser(userId: string): Promise<SlotSubscription[]> {
    try {
      const q = query(
        collection(db, 'slotAlertSubscriptions'),
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      const subs: SlotSubscription[] = [];
      snap.forEach((doc) => {
        subs.push(doc.data() as SlotSubscription);
      });
      return subs;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'slotAlertSubscriptions');
    }
  },

  // Trigger alerts when a slot becomes available (cancelled)
  async triggerAlerts(pitchId: string, date: string, time: string, pitchName: string): Promise<void> {
    console.log(`Triggering alerts for slot via cancellation event: ${pitchId} | ${date} | ${time}`);
    try {
      const cancellationId = `cancel-${pitchId}-${date}-${time}-${Date.now()}`.replace(/[\/\s—:]/g, '-');
      const cancelRef = doc(db, 'slotCancellations', cancellationId);
      await setDoc(cancelRef, {
        id: cancellationId,
        pitchId,
        pitchName,
        date,
        time,
        cancelledAt: new Date().toISOString(),
        cancelledBy: auth.currentUser?.uid || ''
      });
      console.log('Cancellation event written successfully to slotCancellations.');
    } catch (err) {
      console.error('Error writing slot cancellation event:', err);
      handleFirestoreError(err, OperationType.WRITE, 'slotCancellations');
    }
  },

  // List unread notifications for a user
  async listNotificationsByUser(userId: string): Promise<SlotNotification[]> {
    const q = query(
      collection(db, 'slotNotifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    try {
      const snap = await getDocs(q);
      const list: SlotNotification[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as SlotNotification);
      });
      return list;
    } catch (err) {
      console.error('Error listing notifications:', err);
      handleFirestoreError(err, OperationType.LIST, 'slotNotifications');
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const ref = doc(db, 'slotNotifications', notificationId);
      await updateDoc(ref, { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'slotNotifications');
    }
  }
};
