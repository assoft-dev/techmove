import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import type { Corridas, Motoristas } from "../../Models/index.js";
import { corridasService } from "../../services/corridasService.js";
import { motoristasService } from "../../services/motoristasService.js";
import { ensureSocket } from "../../services/socketManager.js";
import { useSessionStore } from "../../store/sessionStore.js";
import {
  formatPrecoEUR,
  formatQuando,
  rideStatusLabelPt,
  sortCorridasPorDataDesc,
} from "./corridaUi.js";
import "./FinalizarCorrida.modulo.css";

export default function FinalizarCorrida() {
  const token = useSessionStore((s) => s.token);
  const user = useSessionStore((s) => s.user);

  const [driverProfile, setDriverProfile] = useState<Motoristas | null>(null);
  const [ativas, setAtivas] = useState<Corridas[]>([]);

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyKind, setBusyKind] = useState<"start" | "finish" | null>(null);

  const load = useCallback(async () => {
    if (!token || !user || user.role !== "driver") return;

    try {
      setFetchError(null);
      const motoristas = await motoristasService.buscarTodos();
      const me =
        motoristas.find((m) => m.userId === user.id) ?? null;
      setDriverProfile(me);

      const rides = await corridasService.buscarTodos();
      if (!me) {
        setAtivas([]);
        return;
      }
      const mine = rides.filter(
        (c) =>
          c.driverId === me.id &&
          (c.status === "accepted" || c.status === "in_progress"),
      );
      setAtivas(sortCorridasPorDataDesc(mine));
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "Não foi possível carregar os dados.",
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
    const id = window.setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [token, user, load]);

  useEffect(() => {
    if (!token || !driverProfile || ativas.length === 0) return;
    const ride = ativas.find(
      (c) => c.status === "accepted" || c.status === "in_progress",
    );
    if (!ride || !navigator.geolocation) return;

    const socket = ensureSocket(token);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        socket.emit(
          "driver:location",
          {
            rideId: ride.id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          () => {},
        );
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 20000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [token, driverProfile, ativas]);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const account = user;

  if (account.role !== "driver") {
    return (
      <div className="finalizarCorrida_wrap">
        <div className="finalizarCorrida_blocked">
          <p className="font-medium">Área exclusiva de motoristas</p>
          <p className="mt-2">
            O teu perfil é <strong>{account.role}</strong>. Só motoristas podem
            finalizar corridas em curso.
          </p>
          <p className="mt-4">
            <Link to="/" className="finalizarCorrida_link">
              Voltar ao início
            </Link>
          </p>
        </div>
      </div>
    );
  }

  async function iniciarViagem(corridaId: number) {
    setBusyId(corridaId);
    setBusyKind("start");
    setActionError(null);
    try {
      await corridasService.atualizar(corridaId, { status: "in_progress" });
      await load();
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Não foi possível iniciar a viagem.",
      );
    } finally {
      setBusyId(null);
      setBusyKind(null);
    }
  }

  async function finalizar(corridaId: number) {
    setBusyId(corridaId);
    setBusyKind("finish");
    setActionError(null);
    try {
      await corridasService.atualizar(corridaId, { status: "completed" });
      setAtivas((prev) => prev.filter((c) => c.id !== corridaId));
    } catch (e) {
      setActionError(
        e instanceof Error
          ? e.message
          : "Não foi possível finalizar a corrida.",
      );
    } finally {
      setBusyId(null);
      setBusyKind(null);
    }
  }

  const semPerfilMotorista =
    !loading && !fetchError && driverProfile === null;

  return (
    <div className="finalizarCorrida_wrap">
      <h1 className="finalizarCorrida_title">Finalizar corrida</h1>
      <p className="finalizarCorrida_lead">
        Motorista: <strong>{account.name}</strong> ({account.email})
      </p>

      {loading ? (
        <p className="finalizarCorrida_meta">A carregar…</p>
      ) : null}

      {semPerfilMotorista ? (
        <div className="finalizarCorrida_blocked mt-6">
          <p className="font-medium">Perfil de motorista em falta</p>
          <p className="mt-2 text-sm">
            Não foi encontrado um registo de motorista associado à tua conta.
          </p>
        </div>
      ) : null}

      {!semPerfilMotorista && driverProfile ? (
        <p className="finalizarCorrida_meta">
          Viatura: <strong>{driverProfile.carModel}</strong> · Matrícula{" "}
          <strong>{driverProfile.plate}</strong>
        </p>
      ) : null}

      {fetchError ? (
        <p className="finalizarCorrida_error mt-4" role="alert">
          {fetchError}
        </p>
      ) : null}
      {actionError ? (
        <p className="finalizarCorrida_error mt-4" role="alert">
          {actionError}
        </p>
      ) : null}

      {!loading && !semPerfilMotorista ? (
        <div className="finalizarCorrida_toolbar">
          <button
            type="button"
            className="finalizarCorrida_refresh"
            onClick={() => {
              setLoading(true);
              load();
            }}
          >
            Atualizar lista
          </button>
          <span className="finalizarCorrida_hint">
            Estados são atualizados automaticamente a cada 15&nbsp;s.
          </span>
        </div>
      ) : null}

      {!loading && !semPerfilMotorista && ativas.length === 0 ? (
        <p className="finalizarCorrida_empty mt-6">
          Não tens corridas aceites ou em curso para finalizar.
        </p>
      ) : null}

      {!semPerfilMotorista && ativas.length > 0 ? (
        <ul className="finalizarCorrida_list">
          {ativas.map((c) => (
            <li key={c.id} className="finalizarCorrida_card">
              <div className="finalizarCorrida_cardHead">
                <span className="finalizarCorrida_id">#{c.id}</span>
                <span className="finalizarCorrida_badge">
                  {rideStatusLabelPt(c.status)}
                </span>
                <span className="finalizarCorrida_when">
                  {formatQuando(c.requested_at)}
                </span>
              </div>
              <dl className="finalizarCorrida_dl">
                <div>
                  <dt>Preço</dt>
                  <dd>{formatPrecoEUR(c.price)}</dd>
                </div>
                <div>
                  <dt>Cliente (ID)</dt>
                  <dd>{c.clientId}</dd>
                </div>
                <div className="finalizarCorrida_dlWide">
                  <dt>Recolha</dt>
                  <dd>
                    {c.pickupLat.toFixed(5)}, {c.pickupLng.toFixed(5)}
                  </dd>
                </div>
                <div className="finalizarCorrida_dlWide">
                  <dt>Destino</dt>
                  <dd>
                    {c.dropLat.toFixed(5)}, {c.dropLng.toFixed(5)}
                  </dd>
                </div>
              </dl>
              <div className="finalizarCorrida_actions">
                {c.status === "accepted" ? (
                  <button
                    type="button"
                    className="finalizarCorrida_secondary"
                    disabled={busyId !== null}
                    onClick={() => iniciarViagem(c.id)}
                  >
                    {busyId === c.id && busyKind === "start"
                      ? "A iniciar…"
                      : "Iniciar viagem"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="finalizarCorrida_submit"
                  disabled={busyId !== null}
                  onClick={() => finalizar(c.id)}
                >
                  {busyId === c.id && busyKind === "finish"
                    ? "A finalizar…"
                    : "Finalizar corrida"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
