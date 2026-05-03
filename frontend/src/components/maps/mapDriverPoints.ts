/** Ponto no mapa (motorista ou marcadores de corrida). */
export type MapDriverPoint = {
  id: number;
  lat: number;
  lng: number;
  /** Tooltip / acessibilidade */
  title?: string;
  /** Estilo do pin (recolha / destino / motorista em movimento). */
  pin?: "default" | "pickup" | "drop" | "driver";
};
