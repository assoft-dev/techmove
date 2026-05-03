import type {
  LoginPayload,
  MotoristaAtualizarPayload,
  MotoristaCriarPayload,
  Motoristas,
} from "../Models/index.js";
import { api } from "./apiClient.js";

/** Rotas do controller de motoristas (`/motoristas`). */
export const motoristasService = {
  guardar(body: MotoristaCriarPayload) {
    return api.post<Motoristas>("/motoristas", body).then((r) => r.data);
  },

  atualizar(id: number, body: MotoristaAtualizarPayload) {
    return api
      .put<Motoristas>(`/motoristas/${id}`, body)
      .then((r) => r.data);
  },

  apagar(id: number) {
    return api
      .delete<{ id: number; removido: boolean }>(`/motoristas/${id}`)
      .then((r) => r.data);
  },

  buscarTodos() {
    return api.get<Motoristas[]>("/motoristas").then((r) => r.data);
  },

  buscar(id: number) {
    return api.get<Motoristas>(`/motoristas/${id}`).then((r) => r.data);
  },

  login(body: LoginPayload) {
    return api.post<Motoristas>("/motoristas/login", body).then((r) => r.data);
  },
};
