import { create } from "zustand";
import type { UsuarioPublic } from "../Models/Usuarios.js";

const TOKEN_KEY = "techmove_token";
const USER_KEY = "techmove_user";

type SessionState = {
  token: string | null;
  user: UsuarioPublic | null;
  /** Guarda token + utilizador após login ou registo. */
  setSession: (token: string, user: UsuarioPublic) => void;
  /** Remove sessão (logout). */
  clearSession: () => void;
};

function readToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function readUser(): UsuarioPublic | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UsuarioPublic;
  } catch {
    return null;
  }
}

export const useSessionStore = create<SessionState>((set) => ({
  token: readToken(),
  user: readUser(),
  setSession: (token, user) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ token, user });
  },
  clearSession: () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    set({ token: null, user: null });
  },
}));
