export type UserRole = "client" | "driver" | "admin";

/** Linha da tabela `users` */
export interface Usuarios {
  id: number;
  name: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date;
}

/** Resposta da API sem password (`created_at` em ISO string no JSON). */
export type UsuarioPublic = Omit<Usuarios, "password"> & {
  created_at: string;
};

/** Resposta de `POST /usuarios` e `POST /usuarios/login` com JWT. */
export type AuthUsuarioSession = {
  token: string;
  user: UsuarioPublic;
};

export interface UsuarioCriarPayload {
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  password?: string;
  passwordPlano?: string;
}

export interface UsuarioAtualizarPayload {
  name?: string;
  phone?: string;
  email?: string;
  role?: UserRole;
  password?: string;
  passwordPlano?: string;
}
