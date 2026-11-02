import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../lib/firebase';
import { compressImage } from '../utils/compressImage';

const storage = getStorage(app);

const STALL_TIMEOUT_MS = 30000; // 30s without byte progress
const HARD_TIMEOUT_MS = 120000; // 120s max limit
const MAX_RETRIES = 2; // 2 retries (3 attempts total)

const NON_RETRYABLE_ERRORS: Record<string, string> = {
  'storage/unauthorized': 'You do not have permission to upload this photo. Please sign in again.',
  'storage/canceled': 'Photo upload was canceled.',
  'storage/quota-exceeded': 'Storage quota exceeded. Please contact support.',
  'storage/invalid-argument': 'Invalid file upload arguments.',
};

function getNonRetryableMessage(err: any): string | null {
  if (!err) return null;
  const code = err.code || '';
  if (NON_RETRYABLE_ERRORS[code]) {
    return NON_RETRYABLE_ERRORS[code];
  }
  const msg = typeof err.message === 'string' ? err.message : '';
  for (const [c, explanation] of Object.entries(NON_RETRYABLE_ERRORS)) {
    if (msg.includes(c)) return explanation;
  }
  return null;
}

async function uploadWithResilience(
  storagePath: string,
  blob: Blob,
  fileName: string,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<string> {
  let attempt = 0;
  let lastError: any = null;

  while (attempt <= MAX_RETRIES) {
    if (signal?.aborted) {
      const cancelErr: any = new Error('Photo upload was canceled.');
      cancelErr.code = 'storage/canceled';
      throw cancelErr;
    }
    try {
      return await executeUpload(storagePath, blob, fileName, onProgress, signal);
    } catch (err: any) {
      lastError = err;
      if (signal?.aborted || err.code === 'storage/canceled' || (err.message && err.message.includes('canceled'))) {
        throw new Error('Photo upload was canceled.');
      }
      const nonRetryable = getNonRetryableMessage(err);
      if (nonRetryable) {
        throw new Error(nonRetryable);
      }
      attempt++;
      if (attempt <= MAX_RETRIES) {
        // Short backoff before retry (1000ms, then 2000ms) for network-type errors only
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  console.error('All upload attempts failed:', lastError);
  throw new Error('Upload failed. Check your connection and try again.');
}

function executeUpload(
  storagePath: string,
  blob: Blob,
  _fileName: string,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      const cancelErr: any = new Error('Photo upload was canceled.');
      cancelErr.code = 'storage/canceled';
      reject(cancelErr);
      return;
    }

    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: 'image/jpeg'
    });

    let lastBytesTransferred = 0;
    let lastProgressTimestamp = Date.now();
    const startTimestamp = Date.now();
    let isSettled = false;

    const cleanup = () => {
      isSettled = true;
      clearInterval(intervalTimer);
      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }
    };

    const handleAbort = () => {
      if (!isSettled) {
        cleanup();
        try {
          uploadTask.cancel();
        } catch {}
        const cancelErr: any = new Error('Photo upload was canceled.');
        cancelErr.code = 'storage/canceled';
        reject(cancelErr);
      }
    };

    if (signal) {
      signal.addEventListener('abort', handleAbort, { once: true });
    }

    const intervalTimer = setInterval(() => {
      if (isSettled) {
        clearInterval(intervalTimer);
        return;
      }
      const now = Date.now();
      // Hard timeout check (120 seconds)
      if (now - startTimestamp > HARD_TIMEOUT_MS) {
        cleanup();
        try {
          uploadTask.cancel();
        } catch {}
        reject(new Error('Upload timed out after 120 seconds.'));
        return;
      }
      // Stall timeout check (no progress for 30s)
      if (now - lastProgressTimestamp > STALL_TIMEOUT_MS) {
        cleanup();
        try {
          uploadTask.cancel();
        } catch {}
        reject(new Error('Upload stalled. No data transferred for 30 seconds.'));
        return;
      }
    }, 1000);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.bytesTransferred > lastBytesTransferred) {
          lastBytesTransferred = snapshot.bytesTransferred;
          lastProgressTimestamp = Date.now();
        }
        if (snapshot.totalBytes > 0 && onProgress) {
          const percent = Math.min(
            100,
            Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          );
          onProgress(percent);
        }
      },
      (error) => {
        if (!isSettled) {
          cleanup();
          reject(error);
        }
      },
      async () => {
        if (!isSettled) {
          cleanup();
          try {
            const downloadUrl = await getDownloadURL(storageRef);
            if (onProgress) onProgress(100);
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        }
      }
    );
  });
}

export const storageService = {
  uploadPaymentProof: async (
    bookingId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<string> => {
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

    // Compress first
    const compressedBlob = await compressImage(file, {
      maxDimension: 2000,
      quality: 0.82,
      maxBytes: 900000
    });

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const storagePath = `payment-proofs/${bookingId}/${fileName}`;

    return await uploadWithResilience(storagePath, compressedBlob, fileName, onProgress);
  },

  uploadPitchPhoto: async (
    userId: string,
    file: File,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal
  ): Promise<string> => {
    if (!userId) {
      throw new Error('User authentication required to upload pitch photos.');
    }

    // Validate file type
    if (!file.type || !file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Only image files are allowed.');
    }

    // Compress first
    const compressedBlob = await compressImage(file, {
      maxDimension: 1600,
      quality: 0.82,
      maxBytes: 600000
    });

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const storagePath = `pitch-photos/${userId}/${fileName}`;

    return await uploadWithResilience(storagePath, compressedBlob, fileName, onProgress, signal);
  }
};
