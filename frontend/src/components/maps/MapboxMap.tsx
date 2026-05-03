import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/mapbox";
import type { MapDriverPoint } from "./mapDriverPoints.js";

type Props = {
  accessToken: string;
  className?: string;
  markers?: MapDriverPoint[];
};

/** Mapa Mapbox GL (token público em `VITE_MAPBOX_TOKEN`). */
export function MapboxMap({ accessToken, className, markers }: Props) {
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !markers?.length) return;

    if (markers.length === 1) {
      map.flyTo({
        center: [markers[0].lng, markers[0].lat],
        zoom: 14,
        duration: 600,
      });
      return;
    }

    const lngs = markers.map((m) => m.lng);
    const lats = markers.map((m) => m.lat);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 48, maxZoom: 15, duration: 600 },
    );
  }, [markers]);

  return (
    <div className={className ?? "h-full w-full"}>
      <Map
        ref={mapRef}
        mapboxAccessToken={accessToken}
        initialViewState={{
          longitude: -9.1393,
          latitude: 38.7223,
          zoom: 12,
        }}
        style={{ width: "100%", height: "100%", minHeight: "320px" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        <NavigationControl position="top-left" />
        {markers?.map((m) => {
          const pin = m.pin ?? "default";
          const pinClass =
            pin === "pickup"
              ? "mapPin mapPin_pickup"
              : pin === "drop"
                ? "mapPin mapPin_drop"
                : pin === "driver"
                  ? "mapPin mapPin_driver"
                  : "mapPin mapPin_default";
          const glyph =
            pin === "pickup" ? "📍" : pin === "drop" ? "🏁" : "🚗";
          return (
            <Marker
              key={`${m.id}-${pin}`}
              longitude={m.lng}
              latitude={m.lat}
              anchor="bottom"
            >
              <div className={pinClass} title={m.title}>
                <span className="mapPin_glyph" aria-hidden>
                  {glyph}
                </span>
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
