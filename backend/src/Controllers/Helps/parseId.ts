/** Devolve id inteiro positivo ou null se inválido. */
export function parseIdParam(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
