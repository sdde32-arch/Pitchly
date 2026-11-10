/**
 * Automated Test Suite for Firebase Environment Isolation
 * Task: TOUR-3j — Environment Isolation Implementation
 *
 * Verifies ENV-01 through ENV-18 against validateAndResolveFirebaseConfig:
 * - Fail-closed staging and production guards
 * - Rejection of production project ID in staging
 * - Rejection of unresolved placeholders
 * - Protection against silent fallback to production
 * - Emulator isolation (prohibited outside development)
 */

import {
  validateAndResolveFirebaseConfig,
  isPlaceholder,
  isValidEmulatorHost,
  isValidPort,
  APPROVED_PRODUCTION_PROJECT_ID,
} from '../lib/firebaseEnv';

interface TestResult {
  id: string;
  description: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function runTest(id: string, description: string, fn: () => void) {
  try {
    fn();
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

console.log('\n\x1b[1m\x1b[36m================================================================\x1b[0m');
console.log('\x1b[1m\x1b[36mFIREBASE ENVIRONMENT ISOLATION TEST SUITE (ENV-01 to ENV-18)\x1b[0m');
console.log('\x1b[1m\x1b[36m================================================================\x1b[0m\n');

// ----------------------------------------------------------------------------
// ENV-01: Valid development configuration
// ----------------------------------------------------------------------------
runTest('ENV-01', 'Valid development configuration resolves cleanly', () => {
  const config = validateAndResolveFirebaseConfig(
    {
      VITE_APP_ENV: 'development',
      VITE_FIREBASE_PROJECT_ID: 'footlink-dev',
      VITE_FIREBASE_API_KEY: 'AIzaSyD-dev-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'footlink-dev.firebaseapp.com',
      VITE_FIREBASE_STORAGE_BUCKET: 'footlink-dev.firebasestorage.app',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      VITE_FIREBASE_APP_ID: '1:123456789:web:devapp',
    },
    'development'
  );

  if (config.environment !== 'development') {
    throw new Error(`Expected environment 'development', got '${config.environment}'`);
  }
  if (config.firebaseConfig.projectId !== 'footlink-dev') {
    throw new Error(`Expected projectId 'footlink-dev', got '${config.firebaseConfig.projectId}'`);
  }
});

// ----------------------------------------------------------------------------
// ENV-02: Valid staging configuration with matching project IDs
// ----------------------------------------------------------------------------
runTest('ENV-02', 'Valid staging configuration with matching project IDs resolves cleanly', () => {
  const config = validateAndResolveFirebaseConfig(
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

  if (config.environment !== 'staging') {
    throw new Error(`Expected environment 'staging', got '${config.environment}'`);
  }
  if (config.firebaseConfig.projectId !== 'footlink-staging-approved') {
    throw new Error(`Expected projectId 'footlink-staging-approved', got '${config.firebaseConfig.projectId}'`);
  }
});

// ----------------------------------------------------------------------------
// ENV-03: Missing staging project ID
// ----------------------------------------------------------------------------
runTest('ENV-03', 'Missing staging project ID fails closed', () => {
  expectThrows(() => {
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'staging',
        VITE_FIREBASE_PROJECT_ID: '',
        VITE_FIREBASE_EXPECTED_PROJECT_ID: 'footlink-staging-approved',
        VITE_FIREBASE_API_KEY: 'AIzaSyD-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'app.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'app.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
        VITE_FIREBASE_APP_ID: '1:123:web:app',
      },
      'staging'
    );
  }, 'Provide an approved staging project ID');
});

// ----------------------------------------------------------------------------
// ENV-04: Missing staging expected project ID
// ----------------------------------------------------------------------------
runTest('ENV-04', 'Missing staging expected project ID fails closed', () => {
  expectThrows(() => {
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'staging',
        VITE_FIREBASE_PROJECT_ID: 'footlink-staging-approved',
        VITE_FIREBASE_EXPECTED_PROJECT_ID: '',
        VITE_FIREBASE_API_KEY: 'AIzaSyD-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'app.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'app.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
        VITE_FIREBASE_APP_ID: '1:123:web:app',
      },
      'staging'
    );
  }, 'VITE_FIREBASE_EXPECTED_PROJECT_ID');
});

// ----------------------------------------------------------------------------
// ENV-05: Staging project ID equals pitchlink-c4df3 (production)
// ----------------------------------------------------------------------------
runTest('ENV-05', 'Staging project ID equals production ID pitchlink-c4df3 fails closed', () => {
  expectThrows(() => {
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'staging',
        VITE_FIREBASE_PROJECT_ID: APPROVED_PRODUCTION_PROJECT_ID,
        VITE_FIREBASE_EXPECTED_PROJECT_ID: APPROVED_PRODUCTION_PROJECT_ID,
        VITE_FIREBASE_API_KEY: 'AIzaSyD-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'pitchlink-c4df3.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'pitchlink-c4df3.firebasestorage.app',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '185767485760',
        VITE_FIREBASE_APP_ID: '1:185767485760:web:app',
      },
      'staging'
    );
  }, 'cannot be the production project ID');
});

// ----------------------------------------------------------------------------
// ENV-06: Staging project ID differs from expected ID
// ----------------------------------------------------------------------------
runTest('ENV-06', 'Staging project ID differs from expected ID fails closed', () => {
  expectThrows(() => {
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'staging',
        VITE_FIREBASE_PROJECT_ID: 'footlink-staging-alpha',
        VITE_FIREBASE_EXPECTED_PROJECT_ID: 'footlink-staging-beta',
        VITE_FIREBASE_API_KEY: 'AIzaSyD-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'app.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'app.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
        VITE_FIREBASE_APP_ID: '1:123:web:app',
      },
      'staging'
    );
  }, 'Staging project ID mismatch');
});

// ----------------------------------------------------------------------------
// ENV-07: Unresolved staging placeholder
// ----------------------------------------------------------------------------
runTest('ENV-07', 'Unresolved staging placeholder fails closed', () => {
  expectThrows(() => {
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'staging',
        VITE_FIREBASE_PROJECT_ID: 'your-staging-project-id',
        VITE_FIREBASE_EXPECTED_PROJECT_ID: 'your-staging-project-id',
        VITE_FIREBASE_API_KEY: 'AIzaSyD-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'app.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'app.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
        VITE_FIREBASE_APP_ID: '1:123:web:app',
      },
      'staging'
    );
  }, 'Provide an approved staging project ID');
});

// ----------------------------------------------------------------------------
// ENV-08: Missing required staging API key
// ----------------------------------------------------------------------------
runTest('ENV-08', 'Missing required staging API key fails closed', () => {
  expectThrows(() => {
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'staging',
        VITE_FIREBASE_PROJECT_ID: 'footlink-staging-approved',
        VITE_FIREBASE_EXPECTED_PROJECT_ID: 'footlink-staging-approved',
        VITE_FIREBASE_API_KEY: '',
        VITE_FIREBASE_AUTH_DOMAIN: 'app.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'app.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
        VITE_FIREBASE_APP_ID: '1:123:web:app',
      },
      'staging'
    );
  }, 'VITE_FIREBASE_API_KEY');
});

// ----------------------------------------------------------------------------
// ENV-09: Missing staging storage bucket
// ----------------------------------------------------------------------------
runTest('ENV-09', 'Missing staging storage bucket fails closed', () => {
  expectThrows(() => {
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'staging',
        VITE_FIREBASE_PROJECT_ID: 'footlink-staging-approved',
        VITE_FIREBASE_EXPECTED_PROJECT_ID: 'footlink-staging-approved',
        VITE_FIREBASE_API_KEY: 'AIzaSyD-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'app.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: '',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
        VITE_FIREBASE_APP_ID: '1:123:web:app',
      },
      'staging'
    );
  }, 'VITE_FIREBASE_STORAGE_BUCKET');
});

// ----------------------------------------------------------------------------
// ENV-10: Valid production configuration
// ----------------------------------------------------------------------------
runTest('ENV-10', 'Valid production configuration resolves cleanly', () => {
  const config = validateAndResolveFirebaseConfig(
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

  if (config.environment !== 'production') {
    throw new Error(`Expected environment 'production', got '${config.environment}'`);
  }
  if (config.firebaseConfig.projectId !== APPROVED_PRODUCTION_PROJECT_ID) {
    throw new Error(`Expected projectId '${APPROVED_PRODUCTION_PROJECT_ID}', got '${config.firebaseConfig.projectId}'`);
  }
});

// ----------------------------------------------------------------------------
// ENV-11: Production expected project ID mismatch
// ----------------------------------------------------------------------------
runTest('ENV-11', 'Production expected project ID mismatch fails closed', () => {
  expectThrows(() => {
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'production',
        VITE_FIREBASE_PROJECT_ID: APPROVED_PRODUCTION_PROJECT_ID,
        VITE_FIREBASE_EXPECTED_PROJECT_ID: 'some-other-target-id',
        VITE_FIREBASE_API_KEY: 'AIzaSyDP2Zv21tUxWL0iIADqtLYssL87BmZDHw8',
        VITE_FIREBASE_AUTH_DOMAIN: 'pitchlink-c4df3.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'pitchlink-c4df3.firebasestorage.app',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '185767485760',
        VITE_FIREBASE_APP_ID: '1:185767485760:web:104cbde6798975d269daa5',
      },
      'production'
    );
  }, 'Production project ID mismatch');
});

// ----------------------------------------------------------------------------
// ENV-12: Production configuration missing required values
// ----------------------------------------------------------------------------
runTest('ENV-12', 'Production configuration missing required values fails closed', () => {
  expectThrows(() => {
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'production',
        VITE_FIREBASE_PROJECT_ID: APPROVED_PRODUCTION_PROJECT_ID,
        VITE_FIREBASE_EXPECTED_PROJECT_ID: APPROVED_PRODUCTION_PROJECT_ID,
        VITE_FIREBASE_API_KEY: '', // Missing
        VITE_FIREBASE_AUTH_DOMAIN: 'pitchlink-c4df3.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'pitchlink-c4df3.firebasestorage.app',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '185767485760',
        VITE_FIREBASE_APP_ID: '1:185767485760:web:104cbde6798975d269daa5',
      },
      'production'
    );
  }, 'VITE_FIREBASE_API_KEY');
});

// ----------------------------------------------------------------------------
// ENV-13: Staging mode attempts to use production fallback
// ----------------------------------------------------------------------------
runTest('ENV-13', 'Staging mode cannot fall back to production credentials', () => {
  expectThrows(() => {
    // Empty staging configuration attempting to rely on legacy fallback
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'staging',
      },
      'staging'
    );
  }, 'Staging Firebase configuration is incomplete');
});

// ----------------------------------------------------------------------------
// ENV-14: Production mode attempts to inherit staging values
// ----------------------------------------------------------------------------
runTest('ENV-14', 'Production mode attempting to inherit staging values fails closed', () => {
  expectThrows(() => {
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'staging', // conflict with production mode
        VITE_FIREBASE_PROJECT_ID: 'footlink-staging-approved',
        VITE_FIREBASE_EXPECTED_PROJECT_ID: 'footlink-staging-approved',
        VITE_FIREBASE_API_KEY: 'AIzaSyD-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'app.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'app.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
        VITE_FIREBASE_APP_ID: '1:123:web:app',
      },
      'production'
    );
  }, 'Production builds must not inherit staging configuration');

  // Also verify production rejects a staging-named project ID
  expectThrows(() => {
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'production',
        VITE_FIREBASE_PROJECT_ID: 'pitchlink-staging',
        VITE_FIREBASE_EXPECTED_PROJECT_ID: 'pitchlink-staging',
        VITE_FIREBASE_API_KEY: 'AIzaSyD-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'pitchlink-staging.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'pitchlink-staging.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
        VITE_FIREBASE_APP_ID: '1:123:web:app',
      },
      'production'
    );
  }, 'Production build cannot use staging project ID');
});

// ----------------------------------------------------------------------------
// ENV-15: Emulator activation in staging mode
// ----------------------------------------------------------------------------
runTest('ENV-15', 'Emulator activation in staging mode fails closed', () => {
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
        VITE_USE_FIREBASE_EMULATOR: 'true', // Forbidden
      },
      'staging'
    );
  }, 'Firebase emulator activation is strictly prohibited in staging mode');
});

// ----------------------------------------------------------------------------
// ENV-16: Emulator activation in production mode
// ----------------------------------------------------------------------------
runTest('ENV-16', 'Emulator activation in production mode fails closed', () => {
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
        VITE_USE_FIREBASE_EMULATOR: 'true', // Forbidden
      },
      'production'
    );
  }, 'Firebase emulator activation is strictly prohibited in production mode');
});

// ----------------------------------------------------------------------------
// ENV-17: Emulator activation with valid development settings
// ----------------------------------------------------------------------------
runTest('ENV-17', 'Emulator activation with valid development settings succeeds', () => {
  const config = validateAndResolveFirebaseConfig(
    {
      VITE_APP_ENV: 'development',
      VITE_USE_FIREBASE_EMULATOR: 'true',
      VITE_FIREBASE_EMULATOR_HOST: '127.0.0.1',
      VITE_FIRESTORE_EMULATOR_PORT: '8080',
      VITE_FIREBASE_AUTH_EMULATOR_PORT: '9099',
    },
    'development'
  );

  if (!config.emulator || !config.emulator.enabled) {
    throw new Error('Expected emulator to be enabled in development configuration');
  }
  if (config.emulator.host !== '127.0.0.1') {
    throw new Error(`Expected emulator host '127.0.0.1', got '${config.emulator.host}'`);
  }
  if (config.emulator.firestorePort !== 8080) {
    throw new Error(`Expected firestorePort 8080, got ${config.emulator.firestorePort}`);
  }
  if (config.emulator.authPort !== 9099) {
    throw new Error(`Expected authPort 9099, got ${config.emulator.authPort}`);
  }
});

// ----------------------------------------------------------------------------
// ENV-18: Invalid emulator host or port
// ----------------------------------------------------------------------------
runTest('ENV-18', 'Invalid emulator host or port fails closed', () => {
  // Invalid host (external domain)
  expectThrows(() => {
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'development',
        VITE_USE_FIREBASE_EMULATOR: 'true',
        VITE_FIREBASE_EMULATOR_HOST: 'malicious-remote-server.com',
        VITE_FIRESTORE_EMULATOR_PORT: '8080',
      },
      'development'
    );
  }, 'Invalid emulator host');

  // Invalid port (out of range)
  expectThrows(() => {
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'development',
        VITE_USE_FIREBASE_EMULATOR: 'true',
        VITE_FIREBASE_EMULATOR_HOST: '127.0.0.1',
        VITE_FIRESTORE_EMULATOR_PORT: '999999',
      },
      'development'
    );
  }, 'Invalid Firestore emulator port');

  // Non-numeric port
  expectThrows(() => {
    validateAndResolveFirebaseConfig(
      {
        VITE_APP_ENV: 'development',
        VITE_USE_FIREBASE_EMULATOR: 'true',
        VITE_FIREBASE_EMULATOR_HOST: '127.0.0.1',
        VITE_FIRESTORE_EMULATOR_PORT: 'invalid-port',
      },
      'development'
    );
  }, 'Invalid Firestore emulator port');
});

// ----------------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------------
const total = results.length;
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;

console.log('\n\x1b[1m================================================================\x1b[0m');
console.log('\x1b[1mENVIRONMENT ISOLATION TEST SUMMARY\x1b[0m');
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
  console.log(`\n\x1b[32m\x1b[1mALL ${total} / ${total} ENVIRONMENT ISOLATION TESTS PASSED! 🛡️\x1b[0m\n`);
  process.exit(0);
}
