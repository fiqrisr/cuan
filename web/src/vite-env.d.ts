/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_LANDING_URL?: string;
  readonly VITE_LANDING_DOMAIN?: string;
  readonly VITE_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
