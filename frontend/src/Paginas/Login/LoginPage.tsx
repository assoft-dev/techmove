import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { UserRole } from "../../Models/index.js";
import { usuariosService } from "../../services/usuariosService.js";
import { useSessionStore } from "../../store/sessionStore.js";
import "./LoginPage.modulo.css";

type Mode = "login" | "register";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode: Mode =
    searchParams.get("modo") === "registar" ? "register" : "login";

  const setSession = useSessionStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setSearchParams(next === "register" ? { modo: "registar" } : {});
    setError(null);
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await usuariosService.login({
        email: email.trim(),
        password,
      });
      setSession(session.token, session.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  async function onRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("A password deve ter pelo menos 8 caracteres");
      return;
    }
    if (password !== passwordConfirm) {
      setError("As passwords não coincidem");
      return;
    }
    setLoading(true);
    try {
      const session = await usuariosService.guardar({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        role,
        password,
      });
      setSession(session.token, session.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no registo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="loginPage_shell">
      <div className="loginPage_tabs">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`loginPage_tab ${mode === "login" ? "loginPage_tabActive" : "loginPage_tabInactive"}`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={`loginPage_tab ${mode === "register" ? "loginPage_tabActive" : "loginPage_tabInactive"}`}
        >
          Criar conta
        </button>
      </div>

      {mode === "login" ? (
        <>
          <h1 className="loginPage_title">Entrar</h1>
          <p className="loginPage_subtitle">
            Email e password da tua conta TechMove.
          </p>
          <form onSubmit={onLogin} className="loginPage_form">
            <div>
              <label htmlFor="email" className="loginPage_label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="loginPage_input"
              />
            </div>
            <div>
              <label htmlFor="password" className="loginPage_label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="loginPage_input"
              />
            </div>
            {error ? (
              <p className="loginPage_error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="loginPage_submit"
            >
              {loading ? "A entrar…" : "Entrar"}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="loginPage_title">Criar conta</h1>
          <p className="loginPage_subtitle">
            Preenche os dados para te registares na plataforma.
          </p>
          <form onSubmit={onRegister} className="loginPage_form">
            <div>
              <label htmlFor="name" className="loginPage_label">
                Nome
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="loginPage_input"
              />
            </div>
            <div>
              <label htmlFor="phone" className="loginPage_label">
                Telefone
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="loginPage_input"
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="loginPage_label">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="loginPage_input"
              />
            </div>
            <div>
              <label htmlFor="role" className="loginPage_label">
                Perfil
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="loginPage_input"
              >
                <option value="client">Cliente</option>
                <option value="driver">Motorista</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label htmlFor="reg-password" className="loginPage_label">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="loginPage_input"
              />
            </div>
            <div>
              <label htmlFor="password-confirm" className="loginPage_label">
                Confirmar password
              </label>
              <input
                id="password-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="loginPage_input"
              />
            </div>
            {error ? (
              <p className="loginPage_error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="loginPage_submit"
            >
              {loading ? "A registar…" : "Registar"}
            </button>
          </form>
        </>
      )}

      <p className="loginPage_footer">
        <Link to="/" className="loginPage_footerLink">
          Voltar ao início
        </Link>
      </p>
    </div>
  );
}
