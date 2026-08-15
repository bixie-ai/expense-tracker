/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANGULAR_BASE_URL: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
