/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production'
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_EXPECTED_PROJECT_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIRESTORE_DATABASE_ID?: string
  readonly VITE_USE_FIREBASE_EMULATOR?: string
  readonly VITE_FIREBASE_EMULATOR_HOST?: string
  readonly VITE_FIRESTORE_EMULATOR_PORT?: string
  readonly VITE_FIREBASE_AUTH_EMULATOR_PORT?: string
  readonly VITE_FIREBASE_STORAGE_EMULATOR_PORT?: string
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
