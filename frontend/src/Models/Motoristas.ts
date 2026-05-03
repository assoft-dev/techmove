export type DriverStatus = "available" | "busy" | "offline";

/** Linha da tabela `drivers` */
export interface Motoristas {
  id: number;
  userId: number;
  plate: string;
  carModel: string;
  status: DriverStatus;
  lat: number | null;
  lng: number | null;
}

export interface MotoristaCriarPayload {
  userId: number;
  plate: string;
  carModel: string;
  status?: DriverStatus;
  lat?: number;
  lng?: number;
}

export type MotoristaAtualizarPayload = Partial<{
  userId: number;
  plate: string;
  carModel: string;
  status: DriverStatus;
  lat: number | null;
  lng: number | null;
}>;
