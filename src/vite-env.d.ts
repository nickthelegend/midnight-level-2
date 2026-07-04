/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UMBRA_NETWORK?: string;
  readonly VITE_UMBRA_CONTRACT_ADDRESS?: string;
  readonly VITE_INDEXER_URI?: string;
  readonly VITE_INDEXER_WS_URI?: string;
  readonly VITE_PROOF_SERVER_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
