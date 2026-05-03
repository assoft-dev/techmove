import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import type { Corridas, Motoristas } from "../../Models/index.js";
import { corridasService } from "../../services/corridasService.js";
import { motoristasService } from "../../services/motoristasService.js";
import { useSessionStore } from "../../store/sessionStore.js";
import "./DashboardMotorista.modulo.css";

export default function DashboardMotorista() {
  const token = useSessionStore((s) => s.token);
  const user = useSessionStore((s) => s.user);

  const [driverProfile, setDriverProfile] = useState<Motoristas | null>(null);
  const [corridas, setCorridas] = useState<Corridas[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token || !user || user.role !== "driver") return;
    try {
      setFetchError(null);
      const motoristas = await motoristasService.buscarTodos();
      const me =
        motoristas.find((m) => m.userId === user.id) ?? null;
      setDriverProfile(me);

      const todas = await corridasService.buscarTodos();
      setCorridas(todas);
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "Não foi possível carregar dados.",
      );
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (!token || !user || user.role !== "driver") {
      setLoading(false);
      return;
    }
    load();
    const id = window.setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [token, user, load]);

  const stats = useMemo(() => {
    const pool = corridas.filter(
      (c) => c.status === "requested" && c.driverId == null,
    ).length;

    if (!driverProfile) {
      return {
        pool,
        minhasAtivas: 0,
        concluidasComoMotorista: 0,
        totalAtribuidas: 0,
      };
    }

    const mid = driverProfile.id;
    const minhasAtivas = corridas.filter(
      (c) =>
        c.driverId === mid &&
        (c.status === "accepted" || c.status === "in_progress"),
    ).length;
    const concluidasComoMotorista = corridas.filter(
      (c) => c.driverId === mid && c.status === "completed",
    ).length;
    const totalAtribuidas = corridas.filter((c) => c.driverId === mid).length;

    return {
      pool,
      minhasAtivas,
      concluidasComoMotorista,
      totalAtribuidas,
    };
  }, [corridas, driverProfile]);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "driver") {
    return (
      <div className="dashMot_wrap">
        <div className="dashMot_blocked">
          <p className="font-medium">Painel exclusivo de motoristas</p>
          <p className="mt-2 text-sm">
            Este espaço é para contas com perfil{" "}
            <strong>Motorista</strong>. O teu perfil é{" "}
            <strong>{user.role}</strong>.
          </p>
          <p className="mt-4">
            <Link to="/" className="dashMot_link">
              Voltar ao início
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const semPerfil =
    !loading && !fetchError && driverProfile === null;

  return (
    <div className="dashMot_wrap">
      <header className="dashMot_header">
        <h1 className="dashMot_title">Dashboard motorista</h1>
        <p className="dashMot_lead">
          Olá, <strong>{user.name}</strong>
        </p>
      </header>

      {driverProfile ? (
        <p className="dashMot_vehicle">
          <strong>{driverProfile.carModel}</strong> · {driverProfile.plate} ·
          estado: <strong>{driverProfile.status}</strong>
        </p>
      ) : null}

      {semPerfil ? (
        <div className="dashMot_notice">
          Sem registo de motorista (viatura / matrícula) associado à conta.
          Configura esse vínculo na API ou na base de dados para aceitar e
          finalizar corridas.
        </div>
      ) : null}

      <section className="dashMot_actions" aria-label="Atalhos">
        <Link className="dashMot_action" to="/corrida/aceitar">
          Aceitar corrida
        </Link>
        <Link className="dashMot_action dashMot_actionPrimary" to="/corrida/finalizar">
          Finalizar corrida
        </Link>
        <Link className="dashMot_action" to="/corrida/historico">
          Histórico
        </Link>
        <Link className="dashMot_action" to="/motoristas/mapa">
          Motoristas no mapa
        </Link>
      </section>

      {loading ? (
        <p className="dashMot_meta">A carregar resumo…</p>
      ) : null}

      {fetchError ? (
        <p className="dashMot_error" role="alert">
          {fetchError}
        </p>
      ) : null}

      {!loading && !fetchError ? (
        <section className="dashMot_stats" aria-label="Indicadores">
          <article className="dashMot_stat">
            <span className="dashMot_statValue">{stats.pool}</span>
            <span className="dashMot_statLabel">Pedidos livres (pool)</span>
          </article>
          <article className="dashMot_stat">
            <span className="dashMot_statValue">{stats.minhasAtivas}</span>
            <span className="dashMot_statLabel">Minhas corridas ativas</span>
          </article>
          <article className="dashMot_stat">
            <span className="dashMot_statValue">
              {stats.concluidasComoMotorista}
            </span>
            <span className="dashMot_statLabel">Concluídas (tu)</span>
          </article>
          <article className="dashMot_stat">
            <span className="dashMot_statValue">{stats.totalAtribuidas}</span>
            <span className="dashMot_statLabel">Total atribuídas a ti</span>
          </article>
        </section>
      ) : null}

      {!loading && driverProfile && stats.pool > 0 ? (
        <p className="dashMot_hint">
          Há <strong>{stats.pool}</strong> pedido(s) na fila — abre{" "}
          <Link to="/corrida/aceitar" className="dashMot_inlineLink">
            Aceitar corrida
          </Link>{" "}
          para os ver.
        </p>
      ) : null}
    </div>
  );
}
