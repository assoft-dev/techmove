import { Link, Outlet } from "react-router-dom";
import { disconnectSocket } from "../services/socketManager.js";
import { useSessionStore } from "../store/sessionStore.js";
import "./RootLayout.modulo.css";

export default function RootLayout() {
  const token = useSessionStore((s) => s.token);
  const user = useSessionStore((s) => s.user);
  const clearSession = useSessionStore((s) => s.clearSession);

  return (
    <div className="rootLayout">
      <header className="rootLayout_header">
        <div className="rootLayout_inner">
          <Link to="/" className="rootLayout_brand">
            TechMove
          </Link>
          <nav className="rootLayout_nav">
            <Link to="/" className="rootLayout_navLink">
              Início
            </Link>
            <Link to="/motoristas/mapa" className="rootLayout_navLink">
              Motoristas no mapa
            </Link>
            {token && user?.role === "client" ? (
              <>
                <Link
                  to="/dashboard/passageiro"
                  className="rootLayout_navLink"
                >
                  Painel passageiro
                </Link>
                <Link to="/corrida/pedir" className="rootLayout_navLink">
                  Pedir corrida
                </Link>
              </>
            ) : null}
            {token && user?.role === "admin" ? (
              <Link to="/admin/painel" className="rootLayout_navLink">
                Painel admin
              </Link>
            ) : null}
            {token && user?.role === "driver" ? (
              <>
                <Link to="/dashboard/motorista" className="rootLayout_navLink">
                  Painel motorista
                </Link>
                <Link to="/corrida/aceitar" className="rootLayout_navLink">
                  Aceitar corrida
                </Link>
                <Link to="/corrida/finalizar" className="rootLayout_navLink">
                  Finalizar corrida
                </Link>
              </>
            ) : null}
            {token ? (
              <>
                <Link to="/corrida/historico" className="rootLayout_navLink">
                  Histórico
                </Link>
                <span className="rootLayout_navMeta" title={user?.email ?? ""}>
                  {user?.name ?? "Conta"}
                </span>
                <button
                  type="button"
                  className="rootLayout_navButton"
                  onClick={() => {
                    disconnectSocket();
                    clearSession();
                  }}
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rootLayout_navLink">
                  Entrar
                </Link>
                <Link to="/login?modo=registar" className="rootLayout_navLink">
                  Registar
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="rootLayout_main">
        <Outlet />
      </main>
    </div>
  );
}
