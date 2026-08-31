

interface ImportMetaEnv {
  readonly VITE_TWELVEDATA_API_KEY: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
