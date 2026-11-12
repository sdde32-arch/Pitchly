/**
 * Footlink Firebase Environment Isolation & Configuration Resolver
 * Task: TOUR-3j — Fail-Closed Firebase Environment Isolation
 *
 * Enforces strict environment separation across:
 * 1. development (local dev & emulator)
 * 2. staging (dedicated isolated cloud project, strictly validated)
 * 3. production (live customer environment, strictly validated)
 *
 * Security Guarantees:
 * - Fail-closed: Missing, mismatched, or placeholder configuration immediately halts initialization.
 * - Staging builds NEVER silently fall back to production credentials or firebase-applet-config.json.
 * - Production project ID 'pitchlink-c4df3' is strictly forbidden in staging builds.
 * - Local emulators are strictly banned in staging and production modes.
 */

export type AppEnvironment = 'development' | 'staging' | 'production';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface EmulatorConfig {
  enabled: boolean;
  host: string;
  firestorePort: number;
  authPort?: number;
  storagePort?: number;
}

export interface ResolvedFirebaseConfig {
  environment: AppEnvironment;
  firebaseConfig: FirebaseClientConfig;
  databaseId: string;
  emulator?: EmulatorConfig;
}

/**
 * Current approved production candidate project ID.
 * Must match VITE_FIREBASE_EXPECTED_PROJECT_ID during production builds.
 */
export const APPROVED_PRODUCTION_PROJECT_ID = 'pitchlink-c4df3';

/**
 * Known placeholder patterns indicating unconfigured values.
 */
const PLACEHOLDER_PATTERNS = [
  /^your[-_]/i,
  /^<.*>$/,
  /^\[.*\]$/,
  /placeholder/i,
  /todo/i,
  /example/i,
  /your_api_key_here/i,
  /staging-project-id/i,
  /your-staging-project-id/i,
  /\[staging_project_id\]/i,
  /\[production_project_id\]/i,
];

/**
 * Checks whether a string is missing, empty, or an unconfigured placeholder.
 */
export function isPlaceholder(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return true;
  const trimmed = val.trim();
  if (trimmed.length === 0) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Validates emulator host (strictly localhost / 127.0.0.1).
 */
export function isValidEmulatorHost(host?: string | null): boolean {
  if (!host) return false;
  const trimmed = host.trim().toLowerCase();
  return trimmed === '127.0.0.1' || trimmed === 'localhost';
}

/**
 * Validates emulator port (integer between 1 and 65535).
 */
export function isValidPort(port: any): boolean {
  if (typeof port === 'number') {
    return Number.isInteger(port) && port > 0 && port <= 65535;
  }
  if (typeof port === 'string') {
    const trimmed = port.trim();
    if (!/^\d+$/.test(trimmed)) return false;
    const num = Number(trimmed);
    return Number.isInteger(num) && num > 0 && num <= 65535;
  }
  return false;
}

/**
 * Validates and resolves Firebase configuration fail-closed.
 *
 * @param rawEnv - Key-value environment dictionary (e.g. import.meta.env or process.env)
 * @param modeOverride - Optional explicit build or runtime mode override ('development' | 'staging' | 'production')
 * @returns Fully validated and resolved Firebase configuration
 * @throws Error if configuration is incomplete, invalid, or violates environment boundaries
 */
export function validateAndResolveFirebaseConfig(
  rawEnv: Record<string, string | undefined>,
  modeOverride?: string
): ResolvedFirebaseConfig {
  // 1. Determine environment tier
  const declaredEnv = (rawEnv.VITE_APP_ENV || '').trim().toLowerCase();
  const rawMode = (modeOverride || declaredEnv || 'development').trim().toLowerCase();

  let environment: AppEnvironment;
  if (rawMode === 'production' || declaredEnv === 'production') {
    environment = 'production';
  } else if (rawMode === 'staging' || declaredEnv === 'staging') {
    environment = 'staging';
  } else {
    environment = 'development';
  }

  // 2. Cross-environment boundary checks
  if (environment === 'production') {
    if (declaredEnv === 'staging') {
      throw new Error(
        '[FirebaseEnv] Environment conflict: VITE_APP_ENV is set to "staging" but build mode is "production". ' +
        'Production builds must not inherit staging configuration.'
      );
    }
  }

  if (environment === 'staging') {
    if (declaredEnv === 'production') {
      throw new Error(
        '[FirebaseEnv] Environment conflict: VITE_APP_ENV is set to "production" but build mode is "staging". ' +
        'Staging builds must not inherit production configuration.'
      );
    }
  }

  // 3. Emulator safety check: Emulators are STRICTLY PROHIBITED in staging and production
  const useEmulatorRaw = (rawEnv.VITE_USE_FIREBASE_EMULATOR || '').trim().toLowerCase();
  const useEmulator = useEmulatorRaw === 'true' || useEmulatorRaw === '1';

  if (useEmulator && environment !== 'development') {
    throw new Error(
      `[FirebaseEnv] Security violation: Firebase emulator activation is strictly prohibited in ${environment} mode. ` +
      'VITE_USE_FIREBASE_EMULATOR must only be enabled in development.'
    );
  }

  // 4. Resolve emulator settings if in development
  let emulatorConfig: EmulatorConfig | undefined;
  if (environment === 'development' && useEmulator) {
    const host = (rawEnv.VITE_FIREBASE_EMULATOR_HOST || '127.0.0.1').trim();
    if (!isValidEmulatorHost(host)) {
      throw new Error(
        `[FirebaseEnv] Invalid emulator host "${host}". Emulator host must be "127.0.0.1" or "localhost".`
      );
    }

    const firestorePortRaw = rawEnv.VITE_FIRESTORE_EMULATOR_PORT || '8080';
    if (!isValidPort(firestorePortRaw)) {
      throw new Error(
        `[FirebaseEnv] Invalid Firestore emulator port "${firestorePortRaw}". Must be an integer between 1 and 65535.`
      );
    }
    const firestorePort = parseInt(firestorePortRaw, 10);

    let authPort: number | undefined;
    if (rawEnv.VITE_FIREBASE_AUTH_EMULATOR_PORT) {
      if (!isValidPort(rawEnv.VITE_FIREBASE_AUTH_EMULATOR_PORT)) {
        throw new Error(`[FirebaseEnv] Invalid Auth emulator port "${rawEnv.VITE_FIREBASE_AUTH_EMULATOR_PORT}".`);
      }
      authPort = parseInt(rawEnv.VITE_FIREBASE_AUTH_EMULATOR_PORT, 10);
    }

    let storagePort: number | undefined;
    if (rawEnv.VITE_FIREBASE_STORAGE_EMULATOR_PORT) {
      if (!isValidPort(rawEnv.VITE_FIREBASE_STORAGE_EMULATOR_PORT)) {
        throw new Error(
          `[FirebaseEnv] Invalid Storage emulator port "${rawEnv.VITE_FIREBASE_STORAGE_EMULATOR_PORT}". Must be an integer between 1 and 65535.`
        );
      }
      storagePort = parseInt(rawEnv.VITE_FIREBASE_STORAGE_EMULATOR_PORT, 10);
    }

    emulatorConfig = {
      enabled: true,
      host,
      firestorePort,
      authPort,
      storagePort,
    };
  }

  // 5. STAGING VALIDATION (FAIL-CLOSED)
  if (environment === 'staging') {
    const projectId = (rawEnv.VITE_FIREBASE_PROJECT_ID || '').trim();
    const expectedProjectId = (rawEnv.VITE_FIREBASE_EXPECTED_PROJECT_ID || '').trim();

    if (!projectId || isPlaceholder(projectId)) {
      throw new Error(
        '[FirebaseEnv] Staging Firebase configuration is incomplete. Provide an approved staging project ID before building.'
      );
    }

    if (!expectedProjectId || isPlaceholder(expectedProjectId)) {
      throw new Error(
        '[FirebaseEnv] Staging configuration requires an explicit VITE_FIREBASE_EXPECTED_PROJECT_ID matching the target project.'
      );
    }

    // Fail if staging attempts to use the production project ID
    if (projectId === APPROVED_PRODUCTION_PROJECT_ID) {
      throw new Error(
        `[FirebaseEnv] Security violation: Staging Firebase project ID cannot be the production project ID "${APPROVED_PRODUCTION_PROJECT_ID}". ` +
        'Staging must connect to a dedicated, isolated staging Firebase project.'
      );
    }

    // Fail on mismatch
    if (projectId !== expectedProjectId) {
      throw new Error(
        `[FirebaseEnv] Staging project ID mismatch: VITE_FIREBASE_PROJECT_ID ("${projectId}") does not match ` +
        `VITE_FIREBASE_EXPECTED_PROJECT_ID ("${expectedProjectId}").`
      );
    }

    // Validate required staging client credentials
    const apiKey = (rawEnv.VITE_FIREBASE_API_KEY || '').trim();
    if (!apiKey || isPlaceholder(apiKey)) {
      throw new Error('[FirebaseEnv] Staging configuration is missing required field: VITE_FIREBASE_API_KEY.');
    }

    const authDomain = (rawEnv.VITE_FIREBASE_AUTH_DOMAIN || '').trim();
    if (!authDomain || isPlaceholder(authDomain)) {
      throw new Error('[FirebaseEnv] Staging configuration is missing required field: VITE_FIREBASE_AUTH_DOMAIN.');
    }

    const storageBucket = (rawEnv.VITE_FIREBASE_STORAGE_BUCKET || '').trim();
    if (!storageBucket || isPlaceholder(storageBucket)) {
      throw new Error('[FirebaseEnv] Staging configuration is missing required field: VITE_FIREBASE_STORAGE_BUCKET.');
    }

    const messagingSenderId = (rawEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim();
    if (!messagingSenderId || isPlaceholder(messagingSenderId)) {
      throw new Error('[FirebaseEnv] Staging configuration is missing required field: VITE_FIREBASE_MESSAGING_SENDER_ID.');
    }

    const appId = (rawEnv.VITE_FIREBASE_APP_ID || '').trim();
    if (!appId || isPlaceholder(appId)) {
      throw new Error('[FirebaseEnv] Staging configuration is missing required field: VITE_FIREBASE_APP_ID.');
    }

    return {
      environment: 'staging',
      firebaseConfig: {
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
      },
      databaseId: (rawEnv.VITE_FIRESTORE_DATABASE_ID || '(default)').trim(),
    };
  }

  // 6. PRODUCTION VALIDATION (FAIL-CLOSED)
  if (environment === 'production') {
    const projectId = (rawEnv.VITE_FIREBASE_PROJECT_ID || '').trim();
    const expectedProjectId = (rawEnv.VITE_FIREBASE_EXPECTED_PROJECT_ID || '').trim();

    if (!projectId || isPlaceholder(projectId)) {
      throw new Error(
        '[FirebaseEnv] Production Firebase configuration is incomplete. Provide an approved production project ID.'
      );
    }

    if (!expectedProjectId || isPlaceholder(expectedProjectId)) {
      throw new Error(
        '[FirebaseEnv] Production configuration requires VITE_FIREBASE_EXPECTED_PROJECT_ID to match the production target.'
      );
    }

    if (projectId !== expectedProjectId) {
      throw new Error(
        `[FirebaseEnv] Production project ID mismatch: VITE_FIREBASE_PROJECT_ID ("${projectId}") does not match ` +
        `VITE_FIREBASE_EXPECTED_PROJECT_ID ("${expectedProjectId}").`
      );
    }

    // Fail if production attempts to use a staging-named project
    if (/staging/i.test(projectId)) {
      throw new Error(
        `[FirebaseEnv] Security violation: Production build cannot use staging project ID "${projectId}".`
      );
    }

    const apiKey = (rawEnv.VITE_FIREBASE_API_KEY || '').trim();
    if (!apiKey || isPlaceholder(apiKey)) {
      throw new Error('[FirebaseEnv] Production configuration is missing required field: VITE_FIREBASE_API_KEY.');
    }

    const authDomain = (rawEnv.VITE_FIREBASE_AUTH_DOMAIN || '').trim();
    if (!authDomain || isPlaceholder(authDomain)) {
      throw new Error('[FirebaseEnv] Production configuration is missing required field: VITE_FIREBASE_AUTH_DOMAIN.');
    }

    const storageBucket = (rawEnv.VITE_FIREBASE_STORAGE_BUCKET || '').trim();
    if (!storageBucket || isPlaceholder(storageBucket)) {
      throw new Error('[FirebaseEnv] Production configuration is missing required field: VITE_FIREBASE_STORAGE_BUCKET.');
    }

    const messagingSenderId = (rawEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim();
    if (!messagingSenderId || isPlaceholder(messagingSenderId)) {
      throw new Error('[FirebaseEnv] Production configuration is missing required field: VITE_FIREBASE_MESSAGING_SENDER_ID.');
    }

    const appId = (rawEnv.VITE_FIREBASE_APP_ID || '').trim();
    if (!appId || isPlaceholder(appId)) {
      throw new Error('[FirebaseEnv] Production configuration is missing required field: VITE_FIREBASE_APP_ID.');
    }

    return {
      environment: 'production',
      firebaseConfig: {
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
      },
      databaseId: (rawEnv.VITE_FIRESTORE_DATABASE_ID || '(default)').trim(),
    };
  }

  // 7. DEVELOPMENT VALIDATION
  const devProjectId = (rawEnv.VITE_FIREBASE_PROJECT_ID || '').trim();
  const devApiKey = (rawEnv.VITE_FIREBASE_API_KEY || '').trim();
  const devAuthDomain = (rawEnv.VITE_FIREBASE_AUTH_DOMAIN || '').trim();
  const devStorageBucket = (rawEnv.VITE_FIREBASE_STORAGE_BUCKET || '').trim();
  const devMessagingSenderId = (rawEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim();
  const devAppId = (rawEnv.VITE_FIREBASE_APP_ID || '').trim();

  // If explicit dev env vars are provided and not placeholders, use them
  if (
    devProjectId &&
    !isPlaceholder(devProjectId) &&
    devApiKey &&
    !isPlaceholder(devApiKey) &&
    devAuthDomain &&
    devStorageBucket &&
    devAppId
  ) {
    return {
      environment: 'development',
      firebaseConfig: {
        apiKey: devApiKey,
        authDomain: devAuthDomain,
        projectId: devProjectId,
        storageBucket: devStorageBucket,
        messagingSenderId: devMessagingSenderId || '123456789',
        appId: devAppId,
      },
      databaseId: (rawEnv.VITE_FIRESTORE_DATABASE_ID || '(default)').trim(),
      emulator: emulatorConfig,
    };
  }

  // If emulator is active in development, allow local emulator fallback credentials
  if (emulatorConfig?.enabled) {
    return {
      environment: 'development',
      firebaseConfig: {
        apiKey: devApiKey || 'demo-api-key',
        authDomain: devAuthDomain || 'demo-footlink.firebaseapp.com',
        projectId: devProjectId || 'demo-footlink-security-test',
        storageBucket: devStorageBucket || 'demo-footlink.appspot.com',
        messagingSenderId: devMessagingSenderId || '123456789',
        appId: devAppId || '1:123456789:web:demoapp',
      },
      databaseId: (rawEnv.VITE_FIRESTORE_DATABASE_ID || '(default)').trim(),
      emulator: emulatorConfig,
    };
  }

  // In development without emulator and without custom env vars:
  // Retain legacy developer convenience fallback ONLY in development mode
  // Note: Staging and Production NEVER reach this path.
  try {
    const fallback = (rawEnv as any).__APPLET_CONFIG__;
    if (fallback && typeof fallback === 'object') {
      return {
        environment: 'development',
        firebaseConfig: {
          apiKey: fallback.apiKey,
          authDomain: fallback.authDomain,
          projectId: fallback.projectId,
          storageBucket: fallback.storageBucket,
          messagingSenderId: fallback.messagingSenderId,
          appId: fallback.appId,
        },
        databaseId: fallback.firestoreDatabaseId || '(default)',
        emulator: emulatorConfig,
      };
    }
  } catch {
    // ignore
  }

  // Development with minimal fallback
  return {
    environment: 'development',
    firebaseConfig: {
      apiKey: devApiKey || 'dev-api-key',
      authDomain: devAuthDomain || 'pitchlink-c4df3.firebaseapp.com',
      projectId: devProjectId || APPROVED_PRODUCTION_PROJECT_ID,
      storageBucket: devStorageBucket || 'pitchlink-c4df3.firebasestorage.app',
      messagingSenderId: devMessagingSenderId || '551117016763',
      appId: devAppId || '1:551117016763:web:e4fc06b3bb53fad5d1a39e',
    },
    databaseId: '(default)',
    emulator: emulatorConfig,
  };
}

/**
 * Resolves Firebase configuration for the current runtime context.
 * In the browser, inspects import.meta.env.
 * In Node.js / SSR / tests, inspects process.env.
 */
export function getFirebaseConfig(): ResolvedFirebaseConfig {
  const env: Record<string, string | undefined> = {};

  if (typeof process !== 'undefined' && process.env) {
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('VITE_') || key === 'NODE_ENV' || key === 'MODE') {
        env[key] = value;
      }
    }
  }

  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    Object.assign(env, (import.meta as any).env);
  }

  const mode =
    env.VITE_APP_ENV ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE) ||
    (typeof process !== 'undefined' && process.env.NODE_ENV) ||
    'development';

  return validateAndResolveFirebaseConfig(env, mode);
}
