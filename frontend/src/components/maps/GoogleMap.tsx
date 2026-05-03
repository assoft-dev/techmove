import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import type { MapDriverPoint } from "./mapDriverPoints.js";

type Props = {
  apiKey: string;
  className?: string;
  markers?: MapDriverPoint[];
};

const defaultCenter = { lat: 38.7223, lng: -9.1393 };

function GoogleMapMarkers({ markers }: { markers: MapDriverPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || markers.length === 0) return;

    if (markers.length === 1) {
      map.setCenter({ lat: markers[0].lat, lng: markers[0].lng });
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
    map.fitBounds(bounds, 48);
  }, [map, markers]);

  return (
    <>
      {markers.map((m) => (
        <Marker
          key={`${m.id}-${m.pin ?? "m"}`}
          position={{ lat: m.lat, lng: m.lng }}
          title={m.title}
        />
      ))}
    </>
  );
}

/** Mapa Google Maps (chave em `VITE_GOOGLE_MAPS_API_KEY`). */
export function GoogleMap({ apiKey, className, markers }: Props) {
  const list = markers ?? [];
  return (
    <div className={className ?? "h-full w-full"}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: "100%", height: "100%", minHeight: "320px" }}
        >
          {list.length > 0 ? <GoogleMapMarkers markers={list} /> : null}
        </Map>
      </APIProvider>
    </div>
  );
}
