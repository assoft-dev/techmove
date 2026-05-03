import type { RideStatus } from "../../Models/index.js";

export function formatPrecoEUR(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatQuando(requested_at: Date | string): string {
  const d =
    typeof requested_at === "string" ? new Date(requested_at) : requested_at;
  return d.toLocaleString("pt-PT");
}

export function rideStatusLabelPt(status: RideStatus): string {
  const labels: Record<RideStatus, string> = {
    requested: "Solicitada",
    accepted: "Aceite",
    in_progress: "Em curso",
    completed: "Concluída",
    cancelled: "Cancelada",
  };
  return labels[status];
}

/** Ordena pela data do pedido (mais recente primeiro). */
export function sortCorridasPorDataDesc<T extends { requested_at: Date | string }>(
  list: T[],
): T[] {
  return [...list].sort((a, b) => {
    const ta =
      typeof a.requested_at === "string"
        ? new Date(a.requested_at).getTime()
        : a.requested_at.getTime();
    const tb =
      typeof b.requested_at === "string"
        ? new Date(b.requested_at).getTime()
        : b.requested_at.getTime();
    return tb - ta;
  });
}
