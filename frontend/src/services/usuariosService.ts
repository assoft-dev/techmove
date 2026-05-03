import type {
  AuthUsuarioSession,
  LoginPayload,
  UsuarioAtualizarPayload,
  UsuarioCriarPayload,
  UsuarioPublic,
} from "../Models/index.js";
import { api } from "./apiClient.js";

/** Rotas do controller de utilizadores (`/usuarios`). */
export const usuariosService = {
  guardar(body: UsuarioCriarPayload) {
    return api.post<AuthUsuarioSession>("/usuarios", body).then((r) => r.data);
  },

  atualizar(id: number, body: UsuarioAtualizarPayload) {
    return api.put<UsuarioPublic>(`/usuarios/${id}`, body).then((r) => r.data);
  },

  apagar(id: number) {
    return api
      .delete<{ id: number; removido: boolean }>(`/usuarios/${id}`)
      .then((r) => r.data);
  },

  buscarTodos() {
    return api.get<UsuarioPublic[]>("/usuarios").then((r) => r.data);
  },

  buscar(id: number) {
    return api.get<UsuarioPublic>(`/usuarios/${id}`).then((r) => r.data);
  },

  login(body: LoginPayload) {
    return api.post<AuthUsuarioSession>("/usuarios/login", body).then((r) => r.data);
  },
};
