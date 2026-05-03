import type {
  CorridaAtualizarPayload,
  CorridaCriarPayload,
  Corridas,
  LoginPayload,
} from "../Models/index.js";
import { api } from "./apiClient.js";

/** Rotas do controller de corridas (`/corridas`). */
export const corridasService = {
  guardar(body: CorridaCriarPayload) {
    return api.post<Corridas>("/corridas", body).then((r) => r.data);
  },

  atualizar(id: number, body: CorridaAtualizarPayload) {
    return api.put<Corridas>(`/corridas/${id}`, body).then((r) => r.data);
  },

  apagar(id: number) {
    return api
      .delete<{ id: number; removido: boolean }>(`/corridas/${id}`)
      .then((r) => r.data);
  },

  buscarTodos() {
    return api.get<Corridas[]>("/corridas").then((r) => r.data);
  },

  buscar(id: number) {
    return api.get<Corridas>(`/corridas/${id}`).then((r) => r.data);
  },

  login(body: LoginPayload) {
    return api.post<Corridas>("/corridas/login", body).then((r) => r.data);
  },
};
