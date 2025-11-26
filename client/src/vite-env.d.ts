/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_BATCHING: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
