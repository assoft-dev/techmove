export type RideStatus =
  | "requested"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";

/** Linha da tabela `rides` */
export interface Corridas {
  id: number;
  clientId: number;
  driverId: number | null;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  price: number;
  status: RideStatus;
  requested_at: Date;
}

export interface CorridaCriarPayload {
  clientId: number;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  price: number;
  driverId?: number | null;
  status?: RideStatus;
}

export type CorridaAtualizarPayload = Partial<{
  clientId: number;
  driverId: number | null;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  price: number;
  status: RideStatus;
}>;
