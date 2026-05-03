import { GoogleMap } from "./GoogleMap.js";
import type { MapDriverPoint } from "./mapDriverPoints.js";
import { MapboxMap } from "./MapboxMap.js";
import "./AppMap.modulo.css";

export type MapProviderName = "mapbox" | "google";

function resolveProvider(): MapProviderName | null {
  const raw = import.meta.env.VITE_MAP_PROVIDER as string | undefined;
  if (raw === "mapbox" || raw === "google") return raw;
  const hasGoogle = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  const hasMapbox = Boolean(import.meta.env.VITE_MAPBOX_TOKEN);
  if (hasGoogle && !hasMapbox) return "google";
  if (hasMapbox) return "mapbox";
  if (hasGoogle) return "google";
  return null;
}

export type AppMapProps = {
  /** Motoristas com coordenadas para mostrar como marcadores. */
  drivers?: MapDriverPoint[];
};

/**
 * Escolhe Mapbox ou Google conforme `VITE_MAP_PROVIDER` ou chaves disponíveis.
 */
export function AppMap({ drivers }: AppMapProps = {}) {
  const provider = resolveProvider();
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as
    | string
    | undefined;

  if (provider === "google" && googleKey) {
    return (
      <GoogleMap
        apiKey={googleKey}
        className="appMap_frame"
        markers={drivers}
      />
    );
  }

  if (provider === "mapbox" && mapboxToken) {
    return (
      <MapboxMap
        accessToken={mapboxToken}
        className="appMap_frame"
        markers={drivers}
      />
    );
  }

  return (
    <div className="appMap_placeholder">
      <p className="appMap_placeholderTitle">Mapa não configurado</p>
      <p className="appMap_placeholderText">
        Defina no <code className="appMap_code">.env</code> uma das opções:{" "}
        <code className="appMap_code">VITE_MAPBOX_TOKEN</code> ou{" "}
        <code className="appMap_code">VITE_GOOGLE_MAPS_API_KEY</code>.
        Opcionalmente{" "}
        <code className="appMap_code">VITE_MAP_PROVIDER=mapbox</code> ou{" "}
        <code className="appMap_code">google</code>.
      </p>
    </div>
  );
}
