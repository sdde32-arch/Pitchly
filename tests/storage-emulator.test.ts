/**
 * Automated Test Suite for Firebase Storage Emulator Integration
 * Task: TOUR-3k — Firebase Storage Emulator Integration
 *
 * Verifies STOR-01 through STOR-07:
 * - Development with emulator enabled connects Storage to configured host and port
 * - Development with emulator disabled preserves standard cloud Storage initialization
 * - Invalid Storage emulator ports fail closed (non-numeric, out-of-range, negative, zero)
 * - Staging mode strictly prohibits Storage emulator activation
 * - Production mode strictly prohibits Storage emulator activation
 * - Emulator initialization cannot occur more than once (singleton protection)
 * - Storage singleton in lib/firebase is properly configured and integrated with storageService
 */

import { initializeApp, deleteApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import {
  validateAndResolveFirebaseConfig,
  APPROVED_PRODUCTION_PROJECT_ID,
} from '../lib/firebaseEnv';
import {
  storage,
  connectStorageEmulatorOnce,
  isStorageEmulatorConnected,
} from '../lib/firebase';
import { storageService } from '../services/storageService';

interface TestResult {
  id: string;
  description: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function runTest(id: string, description: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      throw new Error('Async tests should use runAsyncTest');
    }
    results.push({ id, description, passed: true });
    console.log(`  \x1b[32m✓ PASS\x1b[0m [${id}] ${description}`);
  } catch (err: any) {
    results.push({ id, description, passed: false, error: err?.message || String(err) });
    console.log(`  \x1b[31m✗ FAIL\x1b[0m [${id}] ${description}`);
    console.log(`    Error: ${err?.message || err}`);
  }
}

async function runAsyncTest(id: string, description: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ id, description, passed: true });
    console.log(`  \x1b[32m✓ PASS\x1b[0m [${id}] ${description}`);
  } catch (err: any) {
    results.push({ id, description, passed: false, error: err?.message || String(err) });
    console.log(`  \x1b[31m✗ FAIL\x1b[0m [${id}] ${description}`);
    console.log(`    Error: ${err?.message || err}`);
  }
}

function expectThrows(fn: () => void, expectedSubstr?: string) {
  let threw = false;
  let caughtError: any = null;
  try {
    fn();
  } catch (e: any) {
    threw = true;
    caughtError = e;
  }

  if (!threw) {
    throw new Error('Expected function to throw, but it succeeded without error.');
  }

  if (expectedSubstr && caughtError) {
    const msg = caughtError.message || String(caughtError);
    if (!msg.toLowerCase().includes(expectedSubstr.toLowerCase())) {
      throw new Error(`Expected error message to contain "${expectedSubstr}", but got: "${msg}"`);
    }
  }
}

async function main() {
  console.log('\n\x1b[1m\x1b[36m================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[36mFIREBASE STORAGE EMULATOR INTEGRATION TEST SUITE (STOR-01 to STOR-07)\x1b[0m');
  console.log('\x1b[1m\x1b[36m================================================================\x1b[0m\n');

  // ----------------------------------------------------------------------------
  // STOR-01: Development with emulator enabled connects Storage to configured host and port
  // ----------------------------------------------------------------------------
  await runAsyncTest(
    'STOR-01',
    'Development with emulator enabled connects Storage to configured host and port',
    async () => {
      const config = validateAndResolveFirebaseConfig(
        {
          VITE_APP_ENV: 'development',
          VITE_USE_FIREBASE_EMULATOR: 'true',
          VITE_FIREBASE_EMULATOR_HOST: '127.0.0.1',
          VITE_FIRESTORE_EMULATOR_PORT: '8080',
          VITE_FIREBASE_AUTH_EMULATOR_PORT: '9099',
          VITE_FIREBASE_STORAGE_EMULATOR_PORT: '9199',
        },
        'development'
      );

      if (!config.emulator?.enabled) {
        throw new Error('Expected emulator to be enabled in resolved configuration');
      }
      if (config.emulator.host !== '127.0.0.1') {
        throw new Error(`Expected host '127.0.0.1', got '${config.emulator.host}'`);
      }
      if (config.emulator.storagePort !== 9199) {
        throw new Error(`Expected storagePort 9199, got ${config.emulator.storagePort}`);
      }

      // Initialize an isolated test app
      const testAppName = `test-stor-01-${Date.now()}`;
      const testApp = initializeApp(
        { projectId: 'demo-stor-01', apiKey: 'test-key', appId: '1:1:web:stor01' },
        testAppName
      );
      const testStorage = getStorage(testApp);

      const connected = connectStorageEmulatorOnce(
        testStorage,
        config.emulator.host,
        config.emulator.storagePort
      );

      if (!connected) {
        throw new Error('Expected connectStorageEmulatorOnce to return true on initial connection');
      }
      if ((testStorage as any).host !== '127.0.0.1:9199') {
        throw new Error(`Expected testStorage.host to be '127.0.0.1:9199', got '${(testStorage as any).host}'`);
      }
      if ((testStorage as any)._isUsingEmulator !== true) {
        throw new Error('Expected (testStorage as any)._isUsingEmulator to be true');
      }
      if ((testStorage as any)._protocol !== 'http') {
        throw new Error(`Expected protocol 'http', got '${(testStorage as any)._protocol}'`);
      }

      await deleteApp(testApp);
    }
  );

  // ----------------------------------------------------------------------------
  // STOR-02: Development with emulator disabled uses normal Storage initialization
  // ----------------------------------------------------------------------------
  await runAsyncTest(
    'STOR-02',
    'Development with emulator disabled uses normal cloud Storage initialization',
    async () => {
      const config = validateAndResolveFirebaseConfig(
        {
          VITE_APP_ENV: 'development',
          VITE_USE_FIREBASE_EMULATOR: 'false',
          VITE_FIREBASE_STORAGE_BUCKET: 'footlink-dev.firebasestorage.app',
        },
        'development'
      );

      if (config.emulator !== undefined) {
        throw new Error('Expected config.emulator to be undefined when VITE_USE_FIREBASE_EMULATOR=false');
      }

      const testAppName = `test-stor-02-${Date.now()}`;
      const testApp = initializeApp(
        {
          projectId: 'demo-stor-02',
          apiKey: 'test-key',
          appId: '1:1:web:stor02',
          storageBucket: 'footlink-dev.firebasestorage.app',
        },
        testAppName
      );
      const testStorage = getStorage(testApp);

      // Verify normal cloud Storage defaults without emulator
      if ((testStorage as any).host !== 'firebasestorage.googleapis.com') {
        throw new Error(
          `Expected cloud storage host 'firebasestorage.googleapis.com', got '${(testStorage as any).host}'`
        );
      }
      if ((testStorage as any)._isUsingEmulator === true) {
        throw new Error('Expected _isUsingEmulator to be false when emulator is disabled');
      }
      if ((testStorage as any)._protocol !== 'https') {
        throw new Error(`Expected protocol 'https', got '${(testStorage as any)._protocol}'`);
      }

      await deleteApp(testApp);
    }
  );

  // ----------------------------------------------------------------------------
  // STOR-03: Invalid Storage emulator ports fail closed
  // ----------------------------------------------------------------------------
  runTest('STOR-03', 'Invalid Storage emulator ports fail closed', () => {
    // Non-numeric port
    expectThrows(() => {
      validateAndResolveFirebaseConfig(
        {
          VITE_APP_ENV: 'development',
          VITE_USE_FIREBASE_EMULATOR: 'true',
          VITE_FIREBASE_EMULATOR_HOST: '127.0.0.1',
          VITE_FIRESTORE_EMULATOR_PORT: '8080',
          VITE_FIREBASE_STORAGE_EMULATOR_PORT: 'invalid-port',
        },
        'development'
      );
    }, 'Invalid Storage emulator port');

    // Out of range port (> 65535)
    expectThrows(() => {
      validateAndResolveFirebaseConfig(
        {
          VITE_APP_ENV: 'development',
          VITE_USE_FIREBASE_EMULATOR: 'true',
          VITE_FIREBASE_EMULATOR_HOST: '127.0.0.1',
          VITE_FIRESTORE_EMULATOR_PORT: '8080',
          VITE_FIREBASE_STORAGE_EMULATOR_PORT: '999999',
        },
        'development'
      );
    }, 'Invalid Storage emulator port');

    // Negative port
    expectThrows(() => {
      validateAndResolveFirebaseConfig(
        {
          VITE_APP_ENV: 'development',
          VITE_USE_FIREBASE_EMULATOR: 'true',
          VITE_FIREBASE_EMULATOR_HOST: '127.0.0.1',
          VITE_FIRESTORE_EMULATOR_PORT: '8080',
          VITE_FIREBASE_STORAGE_EMULATOR_PORT: '-1',
        },
        'development'
      );
    }, 'Invalid Storage emulator port');

    // Zero port
    expectThrows(() => {
      validateAndResolveFirebaseConfig(
        {
          VITE_APP_ENV: 'development',
          VITE_USE_FIREBASE_EMULATOR: 'true',
          VITE_FIREBASE_EMULATOR_HOST: '127.0.0.1',
          VITE_FIRESTORE_EMULATOR_PORT: '8080',
          VITE_FIREBASE_STORAGE_EMULATOR_PORT: '0',
        },
        'development'
      );
    }, 'Invalid Storage emulator port');

    // Fractional port
    expectThrows(() => {
      validateAndResolveFirebaseConfig(
        {
          VITE_APP_ENV: 'development',
          VITE_USE_FIREBASE_EMULATOR: 'true',
          VITE_FIREBASE_EMULATOR_HOST: '127.0.0.1',
          VITE_FIRESTORE_EMULATOR_PORT: '8080',
          VITE_FIREBASE_STORAGE_EMULATOR_PORT: '9199.5',
        },
        'Invalid Storage emulator port'
      );
    }, 'Invalid Storage emulator port');
  });

  // ----------------------------------------------------------------------------
  // STOR-04: Staging cannot activate Storage emulation
  // ----------------------------------------------------------------------------
  runTest('STOR-04', 'Staging cannot activate Storage emulation', () => {
    // Attempting emulator in staging throws immediate security violation
    expectThrows(() => {
      validateAndResolveFirebaseConfig(
        {
          VITE_APP_ENV: 'staging',
          VITE_FIREBASE_PROJECT_ID: 'footlink-staging-approved',
          VITE_FIREBASE_EXPECTED_PROJECT_ID: 'footlink-staging-approved',
          VITE_FIREBASE_API_KEY: 'AIzaSyD-key',
          VITE_FIREBASE_AUTH_DOMAIN: 'app.firebaseapp.com',
          VITE_FIREBASE_STORAGE_BUCKET: 'app.appspot.com',
          VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
          VITE_FIREBASE_APP_ID: '1:123:web:app',
          VITE_USE_FIREBASE_EMULATOR: 'true',
          VITE_FIREBASE_STORAGE_EMULATOR_PORT: '9199',
        },
        'staging'
      );
    }, 'strictly prohibited in staging mode');

    // Valid staging config never returns an emulator property
    const validStaging = validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'staging',
        VITE_FIREBASE_PROJECT_ID: 'footlink-staging-approved',
        VITE_FIREBASE_EXPECTED_PROJECT_ID: 'footlink-staging-approved',
        VITE_FIREBASE_API_KEY: 'AIzaSyD-staging-key-valid',
        VITE_FIREBASE_AUTH_DOMAIN: 'footlink-staging-approved.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'footlink-staging-approved.firebasestorage.app',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '987654321012',
        VITE_FIREBASE_APP_ID: '1:987654321012:web:stagingapp',
      },
      'staging'
    );
    if (validStaging.emulator !== undefined) {
      throw new Error('Staging configuration must never contain emulator settings');
    }
  });

  // ----------------------------------------------------------------------------
  // STOR-05: Production cannot activate Storage emulation
  // ----------------------------------------------------------------------------
  runTest('STOR-05', 'Production cannot activate Storage emulation', () => {
    // Attempting emulator in production throws immediate security violation
    expectThrows(() => {
      validateAndResolveFirebaseConfig(
        {
          VITE_APP_ENV: 'production',
          VITE_FIREBASE_PROJECT_ID: APPROVED_PRODUCTION_PROJECT_ID,
          VITE_FIREBASE_EXPECTED_PROJECT_ID: APPROVED_PRODUCTION_PROJECT_ID,
          VITE_FIREBASE_API_KEY: 'AIzaSyDP2Zv21tUxWL0iIADqtLYssL87BmZDHw8',
          VITE_FIREBASE_AUTH_DOMAIN: 'pitchlink-c4df3.firebaseapp.com',
          VITE_FIREBASE_STORAGE_BUCKET: 'pitchlink-c4df3.firebasestorage.app',
          VITE_FIREBASE_MESSAGING_SENDER_ID: '185767485760',
          VITE_FIREBASE_APP_ID: '1:185767485760:web:104cbde6798975d269daa5',
          VITE_USE_FIREBASE_EMULATOR: 'true',
          VITE_FIREBASE_STORAGE_EMULATOR_PORT: '9199',
        },
        'production'
      );
    }, 'strictly prohibited in production mode');

    // Valid production config never returns an emulator property
    const validProd = validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'production',
        VITE_FIREBASE_PROJECT_ID: APPROVED_PRODUCTION_PROJECT_ID,
        VITE_FIREBASE_EXPECTED_PROJECT_ID: APPROVED_PRODUCTION_PROJECT_ID,
        VITE_FIREBASE_API_KEY: 'AIzaSyDP2Zv21tUxWL0iIADqtLYssL87BmZDHw8',
        VITE_FIREBASE_AUTH_DOMAIN: 'pitchlink-c4df3.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'pitchlink-c4df3.firebasestorage.app',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '185767485760',
        VITE_FIREBASE_APP_ID: '1:185767485760:web:104cbde6798975d269daa5',
      },
      'production'
    );
    if (validProd.emulator !== undefined) {
      throw new Error('Production configuration must never contain emulator settings');
    }
  });

  // ----------------------------------------------------------------------------
  // STOR-06: Emulator initialization cannot occur more than once
  // ----------------------------------------------------------------------------
  await runAsyncTest('STOR-06', 'Emulator initialization cannot occur more than once', async () => {
    const testAppName = `test-stor-06-${Date.now()}`;
    const testApp = initializeApp(
      { projectId: 'demo-stor-06', apiKey: 'test-key', appId: '1:1:web:stor06' },
      testAppName
    );
    const testStorage = getStorage(testApp);

    // Initial connection attempt should succeed and return true
    const firstCall = connectStorageEmulatorOnce(testStorage, '127.0.0.1', 9199);
    if (!firstCall) {
      throw new Error('First connectStorageEmulatorOnce call should return true');
    }
    if ((testStorage as any).host !== '127.0.0.1:9199') {
      throw new Error(`Expected host '127.0.0.1:9199', got '${(testStorage as any).host}'`);
    }

    // Subsequent connection attempt on the same instance must return false and not re-connect
    const secondCall = connectStorageEmulatorOnce(testStorage, '127.0.0.1', 9199);
    if (secondCall !== false) {
      throw new Error('Second connectStorageEmulatorOnce call must return false (duplicate connection prevented)');
    }

    // A third call attempting to change port must also return false and leave original host intact
    const thirdCall = connectStorageEmulatorOnce(testStorage, '127.0.0.1', 9999);
    if (thirdCall !== false) {
      throw new Error('Third call attempting port change must return false');
    }
    if ((testStorage as any).host !== '127.0.0.1:9199') {
      throw new Error(`Host must remain '127.0.0.1:9199', but changed to '${(testStorage as any).host}'`);
    }

    await deleteApp(testApp);
  });

  // ----------------------------------------------------------------------------
  // STOR-07: Shared storage singleton and storageService integration
  // ----------------------------------------------------------------------------
  runTest('STOR-07', 'Shared storage singleton and storageService integration', () => {
    if (!storage) {
      throw new Error('Expected storage singleton to be exported from lib/firebase');
    }
    if (typeof storage.app !== 'object') {
      throw new Error('Expected storage.app to be a valid FirebaseApp instance');
    }
    if (typeof storageService.uploadPaymentProof !== 'function') {
      throw new Error('Expected storageService.uploadPaymentProof to be a function');
    }
    if (typeof storageService.uploadPitchPhoto !== 'function') {
      throw new Error('Expected storageService.uploadPitchPhoto to be a function');
    }

    // Check emulator state accessor
    const isConnected = isStorageEmulatorConnected();
    if (typeof isConnected !== 'boolean') {
      throw new Error('Expected isStorageEmulatorConnected() to return a boolean');
    }
  });

  // ----------------------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n\x1b[1m================================================================\x1b[0m');
  console.log('\x1b[1mSTORAGE EMULATOR INTEGRATION TEST SUMMARY\x1b[0m');
  console.log('\x1b[1m================================================================\x1b[0m');
  console.log(`Total Test Cases Executed: \x1b[1m${total}\x1b[0m`);
  console.log(`Passed: \x1b[32m\x1b[1m${passed}\x1b[0m`);
  console.log(`Failed: ${failed > 0 ? '\x1b[31m\x1b[1m' : '\x1b[32m'}${failed}\x1b[0m`);

  if (failed > 0) {
    console.log('\n\x1b[31mFailed Cases Details:\x1b[0m');
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`  [${r.id}] ${r.description}\n    ${r.error}`));
    process.exit(1);
  } else {
    console.log(`\n\x1b[32m\x1b[1mALL ${total} / ${total} STORAGE EMULATOR TESTS PASSED! 🛡️\x1b[0m\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
