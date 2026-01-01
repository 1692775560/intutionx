/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_E2B_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
