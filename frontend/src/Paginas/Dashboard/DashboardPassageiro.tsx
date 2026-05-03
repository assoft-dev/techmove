import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import type { Corridas } from "../../Models/index.js";
import { corridasService } from "../../services/corridasService.js";
import { useSessionStore } from "../../store/sessionStore.js";
import { rideStatusLabelPt } from "../Corrida/corridaUi.js";
import "./DashboardPassageiro.modulo.css";

export default function DashboardPassageiro() {
  const token = useSessionStore((s) => s.token);
  const user = useSessionStore((s) => s.user);

  const [corridas, setCorridas] = useState<Corridas[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token || !user || user.role !== "client") return;
    try {
      setFetchError(null);
      const todas = await corridasService.buscarTodos();
      setCorridas(todas.filter((c) => c.clientId === user.id));
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "Não foi possível carregar dados.",
      );
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (!token || !user || user.role !== "client") {
      setLoading(false);
      return;
    }
    load();
  }, [token, user, load]);

  const stats = useMemo(() => {
    const solicitadas = corridas.filter((c) => c.status === "requested").length;
    const emCurso = corridas.filter(
      (c) => c.status === "accepted" || c.status === "in_progress",
    ).length;
    const concluidas = corridas.filter((c) => c.status === "completed").length;
    const canceladas = corridas.filter((c) => c.status === "cancelled").length;
    return {
      total: corridas.length,
      solicitadas,
      emCurso,
      concluidas,
      canceladas,
    };
  }, [corridas]);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "client") {
    return (
      <div className="dashPass_wrap">
        <div className="dashPass_blocked">
          <p className="font-medium">Painel exclusivo de passageiros</p>
          <p className="mt-2 text-sm">
            Este espaço é para contas com perfil{" "}
            <strong>Cliente</strong>. O teu perfil é{" "}
            <strong>{user.role}</strong>.
          </p>
          <p className="mt-4">
            <Link to="/" className="dashPass_link">
              Voltar ao início
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashPass_wrap">
      <header className="dashPass_header">
        <h1 className="dashPass_title">Dashboard passageiro</h1>
        <p className="dashPass_lead">
          Olá, <strong>{user.name}</strong>
        </p>
      </header>

      <section className="dashPass_actions" aria-label="Atalhos">
        <Link className="dashPass_action dashPass_actionPrimary" to="/corrida/pedir">
          Pedir corrida
        </Link>
        <Link className="dashPass_action" to="/corrida/historico">
          Histórico
        </Link>
        <Link className="dashPass_action" to="/motoristas/mapa">
          Motoristas no mapa
        </Link>
      </section>

      {loading ? (
        <p className="dashPass_meta">A carregar resumo…</p>
      ) : null}

      {fetchError ? (
        <p className="dashPass_error" role="alert">
          {fetchError}
        </p>
      ) : null}

      {!loading && !fetchError ? (
        <section className="dashPass_stats" aria-label="Resumo das tuas corridas">
          <article className="dashPass_stat">
            <span className="dashPass_statValue">{stats.total}</span>
            <span className="dashPass_statLabel">Total</span>
          </article>
          <article className="dashPass_stat">
            <span className="dashPass_statValue">{stats.solicitadas}</span>
            <span className="dashPass_statLabel">Solicitadas</span>
          </article>
          <article className="dashPass_stat">
            <span className="dashPass_statValue">{stats.emCurso}</span>
            <span className="dashPass_statLabel">Aceite / em curso</span>
          </article>
          <article className="dashPass_stat">
            <span className="dashPass_statValue">{stats.concluidas}</span>
            <span className="dashPass_statLabel">Concluídas</span>
          </article>
          <article className="dashPass_stat">
            <span className="dashPass_statValue">{stats.canceladas}</span>
            <span className="dashPass_statLabel">Canceladas</span>
          </article>
        </section>
      ) : null}

      {!loading && corridas.length > 0 ? (
        <section className="dashPass_recent" aria-label="Últimas corridas">
          <h2 className="dashPass_recentTitle">Últimas corridas</h2>
          <ul className="dashPass_recentList">
            {corridas
              .slice()
              .sort((a, b) => {
                const ta =
                  typeof a.requested_at === "string"
                    ? new Date(a.requested_at).getTime()
                    : a.requested_at.getTime();
                const tb =
                  typeof b.requested_at === "string"
                    ? new Date(b.requested_at).getTime()
                    : b.requested_at.getTime();
                return tb - ta;
              })
              .slice(0, 5)
              .map((c) => (
                <li key={c.id} className="dashPass_recentItem">
                  <span className="dashPass_recentId">#{c.id}</span>
                  <span
                    className={`dashPass_recentStatus dashPass_recentStatus__${c.status}`}
                  >
                    {rideStatusLabelPt(c.status)}
                  </span>
                  <span className="dashPass_recentPrice">
                    {new Intl.NumberFormat("pt-PT", {
                      style: "currency",
                      currency: "EUR",
                    }).format(c.price)}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      {!loading && !fetchError && corridas.length === 0 ? (
        <p className="dashPass_empty">
          Ainda não tens corridas. Utiliza &quot;Pedir corrida&quot; para o teu
          primeiro pedido.
        </p>
      ) : null}
    </div>
  );
}
