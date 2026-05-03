/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Mapbox public token (pk.…) */
  readonly VITE_MAPBOX_TOKEN?: string;
  /** Google Maps JavaScript API key */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  /** `mapbox` | `google` — força o fornecedor se a chave correspondente existir */
  readonly VITE_MAP_PROVIDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
