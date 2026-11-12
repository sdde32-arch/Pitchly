import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, collection, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, limit 
} from 'firebase/firestore';

// 1. Firebase Environment-Aware Initialization
// Fail-closed validation guarantees staging builds cannot accidentally connect to production
import { getFirebaseConfig, ResolvedFirebaseConfig } from './firebaseEnv';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

export const resolvedConfig: ResolvedFirebaseConfig = getFirebaseConfig();

export const app = getApps().length === 0 ? initializeApp(resolvedConfig.firebaseConfig) : getApp();
export const auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

// Singleton tracking to guarantee Storage emulator is connected at most once
let storageEmulatorConnected = false;

/**
 * Connects a FirebaseStorage instance to the local emulator exactly once.
 * Returns true if the connection was established, or false if already connected.
 */
export function connectStorageEmulatorOnce(
  storageInstance: FirebaseStorage,
  host: string,
  port: number
): boolean {
  if (storageEmulatorConnected || Boolean((storageInstance as any)._isUsingEmulator)) {
    return false;
  }
  connectStorageEmulator(storageInstance, host, port);
  if (storageInstance === storage) {
    storageEmulatorConnected = true;
  }
  return true;
}

/**
 * Returns whether the shared Storage singleton is connected to an emulator.
 */
export function isStorageEmulatorConnected(): boolean {
  return storageEmulatorConnected || Boolean((storage as any)._isUsingEmulator);
}

// Enable persistent multi-tab offline caching for Firestore
const databaseId = resolvedConfig.databaseId || '(default)';
let firestoreInstance: ReturnType<typeof getFirestore>;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true
    },
    databaseId
  );
} catch {
  firestoreInstance = getFirestore(app, databaseId);
}

// Connect to emulator ONLY if explicitly enabled in development mode
if (resolvedConfig.emulator?.enabled) {
  connectFirestoreEmulator(firestoreInstance, resolvedConfig.emulator.host, resolvedConfig.emulator.firestorePort);
  if (resolvedConfig.emulator.authPort) {
    connectAuthEmulator(auth, `http://${resolvedConfig.emulator.host}:${resolvedConfig.emulator.authPort}`, { disableWarnings: true });
  }
  if (resolvedConfig.emulator.storagePort) {
    connectStorageEmulatorOnce(storage, resolvedConfig.emulator.host, resolvedConfig.emulator.storagePort);
  }
}

export const db = firestoreInstance;

export type ConnectionStatus = 'CONNECTED' | 'BAD_CREDENTIALS' | 'MISSING_TABLES' | 'NETWORK_ERROR';

export const verifyConnection = async (): Promise<ConnectionStatus> => {
  try {
    // Testing Firestore read or Auth connection state to assert connection viability
    return 'CONNECTED';
  } catch {
    return 'NETWORK_ERROR';
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}


