import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import type { Corridas, Motoristas, UsuarioPublic } from "../../Models/index.js";
import { corridasService } from "../../services/corridasService.js";
import { motoristasService } from "../../services/motoristasService.js";
import { usuariosService } from "../../services/usuariosService.js";
import { useSessionStore } from "../../store/sessionStore.js";
import { rideStatusLabelPt, sortCorridasPorDataDesc } from "../Corrida/corridaUi.js";
import "./PainelAdmin.modulo.css";

export default function PainelAdmin() {
  const token = useSessionStore((s) => s.token);
  const user = useSessionStore((s) => s.user);

  const [utilizadores, setUtilizadores] = useState<UsuarioPublic[]>([]);
  const [corridas, setCorridas] = useState<Corridas[]>([]);
  const [motoristas, setMotoristas] = useState<Motoristas[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const load = useCallback(async () => {
    if (!token || !user || user.role !== "admin") return;
    try {
      setFetchError(null);
      const [u, c, m] = await Promise.all([
        usuariosService.buscarTodos(),
        corridasService.buscarTodos(),
        motoristasService.buscarTodos(),
      ]);
      setUtilizadores(u);
      setCorridas(c);
      setMotoristas(m);
      setHasLoadedOnce(true);
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "Não foi possível carregar dados.",
      );
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (!token || !user || user.role !== "admin") {
      setLoading(false);
      return;
    }
    load();
    const id = window.setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [token, user, load]);

  const statsUsers = useMemo(() => {
    const roles = { client: 0, driver: 0, admin: 0 };
    for (const u of utilizadores) {
      if (u.role === "client") roles.client += 1;
      else if (u.role === "driver") roles.driver += 1;
      else if (u.role === "admin") roles.admin += 1;
    }
    return { total: utilizadores.length, ...roles };
  }, [utilizadores]);

  const statsRides = useMemo(() => {
    const byStatus = {
      requested: 0,
      accepted: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const c of corridas) {
      byStatus[c.status] += 1;
    }
    return { total: corridas.length, ...byStatus };
  }, [corridas]);

  const statsDrivers = useMemo(() => {
    const byStatus = { available: 0, busy: 0, offline: 0 };
    for (const m of motoristas) {
      byStatus[m.status] += 1;
    }
    return { total: motoristas.length, ...byStatus };
  }, [motoristas]);

  const ultimasCorridas = useMemo(
    () => sortCorridasPorDataDesc(corridas).slice(0, 6),
    [corridas],
  );

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return (
      <div className="painelAdmin_wrap">
        <div className="painelAdmin_blocked">
          <p className="font-medium">Área reservada a administradores</p>
          <p className="mt-2 text-sm">
            O teu perfil é <strong>{user.role}</strong>. Apenas contas com role{" "}
            <strong>admin</strong> podem aceder a este painel.
          </p>
          <p className="mt-4">
            <Link to="/" className="painelAdmin_link">
              Voltar ao início
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="painelAdmin_wrap">
      <header className="painelAdmin_header">
        <h1 className="painelAdmin_title">Painel Admin</h1>
        <p className="painelAdmin_lead">
          Sessão: <strong>{user.name}</strong> ({user.email})
        </p>
      </header>

      <section className="painelAdmin_actions" aria-label="Atalhos">
        <Link className="painelAdmin_action painelAdmin_actionPrimary" to="/corrida/historico">
          Histórico de corridas (global)
        </Link>
        <Link className="painelAdmin_action" to="/motoristas/mapa">
          Motoristas no mapa
        </Link>
        <Link className="painelAdmin_action" to="/">
          Início
        </Link>
      </section>

      <div className="painelAdmin_toolbar">
        <button
          type="button"
          className="painelAdmin_refresh"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            load();
          }}
        >
          Atualizar dados
        </button>
        <span className="painelAdmin_hint">
          Atualização automática a cada 60&nbsp;s.
        </span>
      </div>

      {loading && !hasLoadedOnce ? (
        <p className="painelAdmin_meta">A carregar…</p>
      ) : null}

      {fetchError ? (
        <p className="painelAdmin_error" role="alert">
          {fetchError}
        </p>
      ) : null}

      {!fetchError && hasLoadedOnce ? (
        <>
          <section className="painelAdmin_section" aria-label="Utilizadores">
            <h2 className="painelAdmin_sectionTitle">Utilizadores</h2>
            <div className="painelAdmin_stats">
              <article className="painelAdmin_stat">
                <span className="painelAdmin_statValue">{statsUsers.total}</span>
                <span className="painelAdmin_statLabel">Total</span>
              </article>
              <article className="painelAdmin_stat">
                <span className="painelAdmin_statValue">{statsUsers.client}</span>
                <span className="painelAdmin_statLabel">Clientes</span>
              </article>
              <article className="painelAdmin_stat">
                <span className="painelAdmin_statValue">{statsUsers.driver}</span>
                <span className="painelAdmin_statLabel">Motoristas</span>
              </article>
              <article className="painelAdmin_stat">
                <span className="painelAdmin_statValue">{statsUsers.admin}</span>
                <span className="painelAdmin_statLabel">Admins</span>
              </article>
            </div>
          </section>

          <section className="painelAdmin_section" aria-label="Corridas">
            <h2 className="painelAdmin_sectionTitle">Corridas</h2>
            <div className="painelAdmin_stats">
              <article className="painelAdmin_stat">
                <span className="painelAdmin_statValue">{statsRides.total}</span>
                <span className="painelAdmin_statLabel">Total</span>
              </article>
              <article className="painelAdmin_stat">
                <span className="painelAdmin_statValue">
                  {statsRides.requested}
                </span>
                <span className="painelAdmin_statLabel">Solicitadas</span>
              </article>
              <article className="painelAdmin_stat">
                <span className="painelAdmin_statValue">
                  {statsRides.accepted}
                </span>
                <span className="painelAdmin_statLabel">Aceites</span>
              </article>
              <article className="painelAdmin_stat">
                <span className="painelAdmin_statValue">
                  {statsRides.in_progress}
                </span>
                <span className="painelAdmin_statLabel">Em curso</span>
              </article>
              <article className="painelAdmin_stat">
                <span className="painelAdmin_statValue">
                  {statsRides.completed}
                </span>
                <span className="painelAdmin_statLabel">Concluídas</span>
              </article>
              <article className="painelAdmin_stat">
                <span className="painelAdmin_statValue">
                  {statsRides.cancelled}
                </span>
                <span className="painelAdmin_statLabel">Canceladas</span>
              </article>
            </div>
          </section>

          <section className="painelAdmin_section" aria-label="Motoristas (frota)">
            <h2 className="painelAdmin_sectionTitle">Motoristas registados</h2>
            <div className="painelAdmin_stats">
              <article className="painelAdmin_stat">
                <span className="painelAdmin_statValue">
                  {statsDrivers.total}
                </span>
                <span className="painelAdmin_statLabel">Viaturas</span>
              </article>
              <article className="painelAdmin_stat">
                <span className="painelAdmin_statValue">
                  {statsDrivers.available}
                </span>
                <span className="painelAdmin_statLabel">Disponível</span>
              </article>
              <article className="painelAdmin_stat">
                <span className="painelAdmin_statValue">
                  {statsDrivers.busy}
                </span>
                <span className="painelAdmin_statLabel">Ocupado</span>
              </article>
              <article className="painelAdmin_stat">
                <span className="painelAdmin_statValue">
                  {statsDrivers.offline}
                </span>
                <span className="painelAdmin_statLabel">Offline</span>
              </article>
            </div>
          </section>

          {ultimasCorridas.length > 0 ? (
            <section className="painelAdmin_recent" aria-label="Últimas corridas">
              <h2 className="painelAdmin_sectionTitle">Últimas corridas</h2>
              <ul className="painelAdmin_recentList">
                {ultimasCorridas.map((c) => (
                  <li key={c.id} className="painelAdmin_recentItem">
                    <span className="painelAdmin_recentId">#{c.id}</span>
                    <span
                      className={`painelAdmin_recentStatus painelAdmin_recentStatus__${c.status}`}
                    >
                      {rideStatusLabelPt(c.status)}
                    </span>
                    <span className="painelAdmin_recentMeta">
                      cliente {c.clientId}
                      {c.driverId != null ? ` · motorista ${c.driverId}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
