import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../lib/firebase';

const storage = getStorage(app);

export const storageService = {
  uploadPaymentProof: async (bookingId: string, file: File): Promise<string> => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.');
    }

    // Validate size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File is too large. Maximum size is 10MB.');
    }

    const ext = (file.name || '').split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const storageRef = ref(storage, `payment-proofs/${bookingId}/${fileName}`);

    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },

  uploadPitchPhoto: async (userId: string, file: File): Promise<string> => {
    const ext = (file.name || 'image.jpg').split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const storageRef = ref(storage, `pitch-photos/${userId}/${fileName}`);

    await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg'
    });
    return await getDownloadURL(storageRef);
  }
};
