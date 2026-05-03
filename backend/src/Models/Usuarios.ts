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
